# Devices list – server side, phase 3: manual test checklist

Status: written 2026-11-10 together with the code. Decisions referenced here are in [decisions.md](decisions.md) (E-n, EI-n, EQ-n, EC-n) and in the 03 / 04 logs; the design is in [02-architecture.md](02-architecture.md). The combined run order of everything deployed together is in [../trainees-list/03-manual-test-checklist.md §0](../trainees-list/03-manual-test-checklist.md).

No test-data script (E-9): the owner populates `AVIV_DEVICE_DATA`; this checklist reads what is there.

---

## A. Environment checks (SSMS, read-only, once)

- [ ] **A.1 Columns of `AVIV_DEVICE_DATA` (E-1).** Expected: `IDNT_DEVICE`, `IDNT_LOCATION`, `LOGI_ACTIVE` (all confirmed by the owner) and no name column. If the location column still carries the old name `IDNT_WING`, change it in `SP_AVIV_GET_DEVICES.sql` (two joins).

```sql
SELECT COLUMNS.column_id, COLUMNS.name, TYPES.name AS type_name, COLUMNS.is_nullable
FROM   sys.columns AS COLUMNS
JOIN   sys.types   AS TYPES ON TYPES.user_type_id = COLUMNS.user_type_id
WHERE  COLUMNS.object_id = OBJECT_ID('dbo.AVIV_DEVICE_DATA')
ORDER BY COLUMNS.column_id;
```

- [ ] **A.2 Id spaces of real and virtual locations (EQ-1).** Expected: no rows. A row means a device on that id would be inserted twice into `#Devices` and the `PRIMARY KEY` would fail loudly; decide with the owner which table wins.

```sql
SELECT IDNT_LOCATION_TRAINEE AS shared_id FROM ODSINTERNALDATA..A_LOCATION
INTERSECT
SELECT IDNT_WING FROM dbo.AVIV_VIRTUAL_WING_DATA;
```

- [ ] **A.3 `TEXT_NAME_FULL` (EQ-2).** Look at a few values: what is the separator, and does the text start with the institute's name? If it does not, prefix the institute name in step 2 of the procedure the way step 3 does for virtual locations.

```sql
SELECT TOP (10) LOCAT.IDNT_LOCATION_TRAINEE, LOCAT.TEXT_NAME_LOCATION, LOCAT.TEXT_NAME_FULL
FROM   ODSINTERNALDATA..A_LOCATION AS LOCAT
WHERE  LOCAT.CODE_SUG_LOCATION NOT IN (3330016, 3330017) AND LOCAT.LOGI_PAIL = 1;
```

- [ ] **A.4 Orphan devices (EQ-3).** Expected: 0 – every active device points at a real or a virtual location. A count above 0 is a data-quality finding for the owner; the procedure does not return those devices.

```sql
SELECT COUNT(*) AS orphan_devices
FROM   dbo.AVIV_DEVICE_DATA AS DEVICE
WHERE  DEVICE.LOGI_ACTIVE = 1
  AND  NOT EXISTS (SELECT 1 FROM ODSINTERNALDATA..A_LOCATION AS LOCAT WHERE LOCAT.IDNT_LOCATION_TRAINEE = DEVICE.IDNT_LOCATION)
  AND  NOT EXISTS (SELECT 1 FROM dbo.AVIV_VIRTUAL_WING_DATA AS VIRTUAL_LOCATION WHERE VIRTUAL_LOCATION.IDNT_WING = DEVICE.IDNT_LOCATION);
```

- [ ] **A.5 The three cases exist in the development data.** At least one active device on a location under a wing, one on a real location directly under the institute (or none – then that case is checked later), one on a virtual location. Without them §D cannot show all three names.

---

## B. Schema

Nothing (E-3 composes the name; no column, no index).

---

## C. Create and re-create the procedures

- [ ] **C.1** `stored-procedures/devices/SP_AVIV_GET_DEVICES.sql` (`CREATE OR ALTER`).
- [ ] **C.2** Re-run the three changed procedures of 03 / 04 (E-8): `trainee-restrictions/SP_AVIV_GET_TRAINEE_RESTRICTIONS.sql`, `number-restrictions/SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS.sql`, `number-restrictions/SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT.sql`. They no longer reference `AVIV_DEVICE_DATA`.
- [ ] **C.3 Verify.** `SELECT name, modify_date FROM sys.procedures WHERE name IN ('SP_AVIV_GET_DEVICES', 'SP_AVIV_GET_TRAINEE_RESTRICTIONS', 'SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS', 'SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT');` – four rows, today's date.

---

## D. Run the procedure against real devices

```sql
DECLARE @Institutions dbo.INT_TABLE; INSERT INTO @Institutions (IDNT_GENERAL) VALUES (<dev institute>);
DECLARE @Wings dbo.INT_TABLE;        -- empty
EXEC dbo.SP_AVIV_GET_DEVICES @IDNT_INSTITUTION_LIST = @Institutions, @IDNT_WINGS_LIST = @Wings;
```

- [ ] **D.1 Rows.** One per active device of the institute; none with `LOGI_ACTIVE = 0` (compare with `SELECT COUNT(*) FROM dbo.AVIV_DEVICE_DATA WHERE LOGI_ACTIVE = 1 AND IDNT_LOCATION IN (…)` if needed).
- [ ] **D.2 Names (E-3), the three cases of the analysis §2.4:** a device under a wing → `מכשיר 12, <TEXT_NAME_FULL>`; a device on a real location not under a wing → the same shape with `IdntWing` 99999; a device on a virtual location → `מכשיר 15, <institute>, <virtual location>` with `IdntWing` 99999. The comma after the number is ours; the rest of the separators are the ODS's (A.3).
- [ ] **D.3 `IdntWing` (E-4).** Real wing ids for locations under a wing; 99999 for the other two cases. Each real wing id exists in `MAIN_WINGS_TABLE` for that institute.
- [ ] **D.4 Order (E-10).** By institute, then wing, then device id.
- [ ] **D.5 By wing only.** `@Institutions` empty, `@Wings` = one real wing → only that wing's devices. `@Wings` = 99999 only → the devices of every institute's virtual wing (the reference's semantics; the client never sends 99999 alone).
- [ ] **D.6 Institute and its wing.** Same rows as D.1 (the wing is dropped from `#ReqWings`).
- [ ] **D.7 Histories return ids only (E-8).** Re-run `trainee-restrictions/00-test-data.sql` and `number-restrictions/00-test-data.sql`: every device grid has two columns, `ConditionsRowId` and `DeviceId`; no `DeviceName`.

---

## F. Wire the C# into the real service (`service-layer/`)

### F.1 Copy the files

| Group | Files |
|---|---|
| Devices (5) | `Controllers/DevicesController.cs` · `Interfaces/IDevicesRepository.cs` · `Models/Devices/DeviceDto.cs` · `Repository/DevicesRepository.cs` · `Utils/StoredProcedures.Devices.cs` |
| Changed on 2026-11-10 (E-8, E-12), re-copied | `Models/RecordRows.cs` · `Services/RecordPartsAssembler.cs` · `Repository/ProcedureParameters.cs` · `Models/TraineeRestrictions/TraineeRestrictionsResponses.cs` · `Models/PhoneExceptions/PhoneExceptionsResponses.cs` · `Services/TraineeRestrictions/TraineeRestrictionsAssembler.cs` · `Services/PhoneExceptions/PhoneRecordsAssembler.cs` |

### F.2 Adaptation points

| # | Where | What to check | Decision |
|---|---|---|---|
| 1–6, 8 | as 03 §F.2 | the shared adaptation points | |
| 7 | `Program.cs` | Add: `builder.Services.AddScoped<IDevicesRepository, DevicesRepository>();` – the controller takes the repository directly, there is no orchestrator (E-12). | E-12 |

- [ ] **F.3 Build.** Zero errors; any reference to `DeviceName` or `ToDevices` left in the real service is a file that was not re-copied.

### F.4 Smoke tests against the API

- [ ] **F.4.1 List.** `POST api/Devices/GetInstituteDevices` with `{ "idntInstitutionList": [<dev institute>], "idntWingList": [] }` → 200 with a bare array `[ { "idntDevice", "textDeviceName", "idntWing", "idntInstitution" }, … ]` (E-12), the rows of §D.1 in the same order.
- [ ] **F.4.2 Input check 400.** Both lists empty → 400 with the plain-text body `"Invalid request values."`. `{ "idntInstitutionList": [0] }` → 200 `[]` (no field-level validation in a read). A stopped SQL Server → 500 `"An error occurred while retrieving devices."` with one log line `Error at GetInstituteDevices`.
- [ ] **F.4.3 Histories (E-8).** `POST api/TraineeRestrictions/GetTraineeRestrictions` for the 03 test trainee → every record has `idntDeviceList: [ … ]` and no `devices`; `POST api/PhoneExceptions/GetTraineePhoneRecords` and `LookupPhoneRestrictionsForPermit` likewise (`existingTraineePermits[].idntDeviceList`).

---

## G. End-to-end with the client (step ד applied)

- [ ] **Devices picker** in the 03 and 04 forms: groups in the institute's wing order ("אגף {name}" for real wings, the virtual wing by its name "מיקומים שונים"), every option labelled with the full name ("מכשיר 12, הדר, אגף א, חדר 3").
- [ ] **Cards** of 03 / 04 records with devices: names resolved from the cached list; a record whose device is no longer active shows "מכשיר {id} – לא פעיל" (EC-2) – test by setting `LOGI_ACTIVE = 0` on a device of a test record and reloading.
- [ ] **Deep link** to a history screen (mobile URL) without visiting the list first: the devices load on demand and the names appear after the load; until then the fallback text.
- [ ] **Permit picker** (04): the existing permits' devices show their names the same way.

---

## H. What the run settles – record the outcome in decisions.md

| Item | Settled by | Record as |
|---|---|---|
| EQ-1 id spaces | A.2 | disjoint / the overlapping ids and the decision |
| EQ-2 `TEXT_NAME_FULL` shape | A.3, D.2 | separator; institute prefix added to step 2 yes / no |
| EQ-3 orphan devices | A.4 | count |
| E-4 virtual wing 99999 in `GetInstitutionsAndWings` | G | confirmed |
| E-8 histories ids only | D.7, F.4.3 | confirmed |
| EC-2 fallback wording | G | the text the owner approved |
