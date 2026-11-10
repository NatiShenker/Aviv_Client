# Devices list – server side, phase 2: architecture

Status: approved by the product owner on 2026-11-10 together with phase 1. **Revised the same day after the owner's review of the written code (E-12):** the query follows the shape of `LocationsController` / `LocationsRepository` / `WingDto.cs` in `reference/service/` – a one-line input check and a `try/catch` in the controller, which calls the repository directly, one DTO file, a bare list in the response. Phase 1 is in [01-business-analysis.md](01-business-analysis.md); decisions in [decisions.md](decisions.md) (E-n, EQ-n, EC-n) and in the 03 / 04 logs.

Scope: `POST Devices/GetInstituteDevices` – one HTTP action, one stored procedure, the service layers, the contract – and the change this query imposes on features 03 and 04: device ids instead of device names in their read procedures, rows, assemblers and DTOs (E-8).

Sibling: [../trainees-list/02-architecture.md](../trainees-list/02-architecture.md) – the same input block in SQL, the same controller shape in C#.

---

## 1. Principles the design follows

1. **Readability first** (G-1, L-14): numbered steps, one temp table, a final `SELECT` that only composes and orders.
2. **The device name is built in one place** – this procedure (E-3, E-8). Nowhere else in SQL or C# does a device have a name.
3. **A read looks like `Locations`** (E-12): controller → repository, no orchestrator (there is no logic between them), no validator, no `ApiActionRunner`; the response is the list itself.
4. **The row is the DTO** (E-6): `DeviceDto` is filled by Dapper and returned as is, like `UnifiedLocationDto`.
5. **The grouping key is the one the client already has** (E-4): the logical wing of `SP_AVIV_GET_LOCATIONS` (`CalcParent`), with `99999` for everything that is not under a real wing.
6. **No catch in the repository** (A-6): an exception becomes the controller's 500, never an empty picker.
7. **No permission check, no paging** (D-17, B-5).

---

## 2. Layers and files

### 2.1 Files of the devices list (5)

| File | Responsibility |
|---|---|
| `Controllers/DevicesController.cs` | `[Authorize] [ApiController] [Route("api/[controller]")]`; one action `GetInstituteDevices` (POST): `isEmpty` check → `BadRequest("Invalid request values.")`, `try` → `Ok(list)`, `catch` → log + `500`. Takes `IDevicesRepository` directly (E-12). |
| `Interfaces/IDevicesRepository.cs`, `Repository/DevicesRepository.cs` | One method, `GetDevicesAsync(DeviceRequestDto)`: two TVPs through `ProcedureParameters.AddIdList`, one `QueryMultiple`, one `Read<DeviceDto>()`. No try/catch. |
| `Models/Devices/DeviceDto.cs` | `DeviceRequestDto` and `DeviceDto` in one file, like `WingDto.cs` (§7). |
| `Utils/StoredProcedures.Devices.cs` | `GET_DEVICES`, a `partial` addition to `StoredProcedures`. |

### 2.2 Shared files changed (3) – E-8 and the reads

| File | Change |
|---|---|
| `Models/RecordRows.cs` | `DeviceRow` loses `DeviceName`; it is `{ ConditionsRowId, DeviceId }`. |
| `Services/RecordPartsAssembler.cs` | `ToDevices(…) : List<LookupItemDto>` becomes `ToDeviceIds(…) : List<int>`. |
| `Repository/ProcedureParameters.cs` | `AddIdList` accepts `null` and removes duplicates (see [../trainees-list/02-architecture.md §2.2](../trainees-list/02-architecture.md)). |

### 2.3 Files of 03 and 04 changed (mechanical) – E-8

| File | Change |
|---|---|
| `stored-procedures/trainee-restrictions/SP_AVIV_GET_TRAINEE_RESTRICTIONS.sql` set 2, `number-restrictions/SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS.sql` set 3, `number-restrictions/SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT.sql` set 4 | The device set returns `ConditionsRowId, DeviceId` only; the `LEFT JOIN dbo.AVIV_DEVICE_DATA` and the `DeviceName` column are removed. |
| `Models/TraineeRestrictions/TraineeRestrictionsResponses.cs` (`TraineeRestrictionRecordDto`), `Models/PhoneExceptions/PhoneExceptionsResponses.cs` (`TraineePhoneRecordDto`, `ExistingPermitDto`) | `List<LookupItemDto> Devices` → `List<int> IdntDeviceList`. |
| `Services/TraineeRestrictions/TraineeRestrictionsAssembler.cs`, `Services/PhoneExceptions/PhoneRecordsAssembler.cs` | Call `RecordPartsAssembler.ToDeviceIds`. |
| `docs/trainee-restrictions/decisions.md`, `docs/number-restrictions/decisions.md` | One amendment row each for I-15. |

Nothing changes in the save procedures, the validators or the requests: they already work with device ids. The 03 / 04 histories keep their wrapped responses (`{ records }`) – the reads of this session return bare lists, and the difference is recorded (E-12, L-15).

### 2.4 The resulting additions to the layout of `service-layer/`

```
Controllers/     DevicesController.cs
Interfaces/      IDevicesRepository.cs
Models/          Devices/  DeviceDto.cs
Repository/      DevicesRepository.cs
Utils/           StoredProcedures.Devices.cs
```

The stored procedure lives in `stored-procedures/devices/SP_AVIV_GET_DEVICES.sql`. No test-data script (E-9).

---

## 3. Action → procedure

| Action | Procedure | Parameters | Result set | HTTP response |
|---|---|---|---|---|
| `POST GetInstituteDevices` | `SP_AVIV_GET_DEVICES` | `@IDNT_INSTITUTION_LIST dbo.INT_TABLE READONLY`, `@IDNT_WINGS_LIST dbo.INT_TABLE READONLY` | 1 `DeviceDto` – one row per active device: `IdntDevice`, `TextDeviceName`, `IdntWing`, `IdntInstitution` | `200` with `List<DeviceDto>` – a bare JSON array (E-12) |

---

## 4. Procedure conventions and structure

Unchanged by the revision. As 04 §4 and L-14, with these steps:

| Step | Section header (Hebrew) | Fills | Rule |
|---|---|---|---|
| 0 | מחיקת טבלאות זמניות; משתנים | – | `@VirtualLocationWingId INT = 99999`; `@CodeSugLocationWing INT = 3330017`; `@CodeSugLocationInstitute INT = 3330016` |
| 1 | מיפוי הפנימיות והאגפים | `#ReqInstitutions`, `#ReqWings` | The block of `SP_AVIV_GET_LOCATIONS`, word for word – same header as in `SP_AVIV_GET_TRAINEES` (A-3) |
| 2 | מכשירים במיקומים אמיתיים | `#Devices (IdntDevice PK, IdntInstitution, IdntWing, TextLocationFullName)` | `AVIV_DEVICE_DATA` (`LOGI_ACTIVE = 1`) ⋈ `A_LOCATION` ⋈ the parent row; the logical wing in `CROSS APPLY … LogicalWing` – `CalcParent` of the reference (E-4, EI-1); `TEXT_NAME_FULL` stored as is; kept when the institute or the logical wing is requested (E-7) |
| 3 | מכשירים במיקומים וירטואליים | `#Devices` | `AVIV_DEVICE_DATA` ⋈ `AVIV_VIRTUAL_WING_DATA` (`LOGI_IS_ACTIVE = 1`) ⟕ the institute's `A_LOCATION` row for its name; wing `@VirtualLocationWingId`; `TextLocationFullName = institute + N', ' + TEXT_WING_NAME` (EI-2) |
| 4 | תוצאה: מכשיר לשורה (DeviceDto) | the result set | `TextDeviceName = N'מכשיר ' + CAST(IdntDevice AS NVARCHAR(10)) + N', ' + ISNULL(TextLocationFullName, N'')` (E-3); `ORDER BY IdntInstitution, IdntWing, IdntDevice` (E-10) |

---

## 5. Business checks and the error contract

- **Procedure:** none; an unknown institute or wing matches nothing.
- **Controller (E-12):** both lists empty → `400` `"Invalid request values."`; any exception → log `Error at GetInstituteDevices` + `500` `"An error occurred while retrieving devices."`. Plain strings, as `LocationsController`.

---

## 6. Input check

One line in the controller: both lists empty → `400`. `null` lists and duplicates are normalized by `ProcedureParameters.AddIdList`; an unknown id matches nothing.

---

## 7. Data shapes (`Models/Devices/DeviceDto.cs`)

```csharp
public record DeviceRequestDto(int[] IdntInstitutionList, int[] IdntWingList);

public class DeviceDto                          // filled by Dapper and returned as is (E-6); one element of the bare response array
{
    public int IdntDevice { get; set; }         // AVIV_DEVICE_DATA.IDNT_DEVICE
    public string TextDeviceName { get; set; } = "";   // "מכשיר {id}, {full location}" (E-3)
    public int IdntWing { get; set; }           // the logical wing: a real wing id or 99999 (E-4)
    public int IdntInstitution { get; set; }
}
```

JSON: `[ { "idntDevice", "textDeviceName", "idntWing", "idntInstitution" }, … ]`.

Shared row after E-8 (`Models/RecordRows.cs`): `public class DeviceRow { public int ConditionsRowId { get; set; } public int DeviceId { get; set; } }`.

---

## 8. Composing the response

None: the controller returns the repository's list. The 03 / 04 assemblers call `RecordPartsAssembler.ToDeviceIds(devicesByConditionsRowId[id])` where they called `ToDevices`.

---

## 9. Client changes (C-list)

[decisions.md section C](decisions.md): EC-1 (`DeviceDto` and the request in server names; bare array; grouping by `idntWing`), EC-2 (`idntDeviceList` on the 03 / 04 records; names resolved from the cached devices with the fallback "מכשיר {id} - לא פעיל"), EC-3 (mock devices regenerated).

---

## 10. Phase 3 – what was written

1. **SQL.** `stored-procedures/devices/SP_AVIV_GET_DEVICES.sql`; the three 03 / 04 procedures edited per §2.3.
2. **C#.** The five files of §2.1; the three shared files of §2.2; the four 03 / 04 files of §2.3. Written first with an orchestrator, a validator and two model files, and slimmed the same day to the Locations shape (E-12).
3. **Docs.** The I-15 amendment rows in the 03 and 04 logs; `03-manual-test-checklist.md` of this folder.
