# Decisions log – devices list (server side)

`POST Devices/GetInstituteDevices`: the active devices of one or more institutes (or wings), with a composed display name and the wing they are grouped under in the "מכשירים מותרים" picker (spec 00 §6; Q-7 of 04 until now). Written on 2026-11-10 in one session together with the trainees list and the DECODE lookup.

How this log relates to the other logs: decisions of 04 and 03 are not re-decided (section V); new decisions are **E-n**, implementation notes **EI-n**, open items **EQ-n**, client changes **EC-n**. One 04 decision is amended by this query – I-15 – and the amendment is recorded both here (E-8) and as a row in the 03 and 04 logs.

Status values: **Closed**, **Adopted**, **Open**. Dates: review rounds on 2026-11-10; phases 2 and 3 written the same day in sequence by the owner's instruction.

---

## E – decisions

| ID | Topic | Tables | Decision | Status |
|---|---|---|---|---|
| E-1 | The devices table | `AVIV_DEVICE_DATA`, `AVIV_PERMITS_DEVICE` | **`AVIV_DEVICE_DATA`** holds the devices: `IDNT_DEVICE` (the number in the display name), `IDNT_LOCATION` (a real or a virtual location id), `LOGI_ACTIVE` (a removed device keeps its row with 0 – owner). `AVIV_PERMITS_DEVICE` stays the link permit ↔ device of 04. The request's first wording ("ב-AVIV_PERMITS_DEVICE יש את המכשירים עצמם") was resolved in review. There is no name column. | Closed |
| E-2 | Real and virtual locations in one column | `AVIV_DEVICE_DATA`, `ODSINTERNALDATA..A_LOCATION`, `AVIV_VIRTUAL_WING_DATA` | `IDNT_LOCATION` points at `A_LOCATION.IDNT_LOCATION_TRAINEE` (real) **or** `AVIV_VIRTUAL_WING_DATA.IDNT_WING` (virtual), the way `SP_AVIV_GET_LOCATIONS` tests `HasDevice` against both. The procedure reads the two cases in two steps into one temp table; the id spaces are assumed disjoint (EQ-1). A virtual location counts only while `LOGI_IS_ACTIVE = 1`. | Closed |
| E-3 | The display name | `A_LOCATION`, `AVIV_VIRTUAL_WING_DATA` | **Composed in the procedure, and only there**: `N'מכשיר ' + CAST(IDNT_DEVICE AS NVARCHAR(10)) + N', ' + {location text}`. Real location: `A_LOCATION.TEXT_NAME_FULL` (the whole hierarchy in one column – owner, replacing the first proposal of two joins and a `CASE`). Virtual location: institute name (the `A_LOCATION` row of type 3330016, `TEXT_NAME_LOCATION`, the join 04 uses – I-15) + `N', '` + `TEXT_WING_NAME` → "מכשיר 15, הדר, חדר אוכל". Comma as the separator we add (owner); the separator inside `TEXT_NAME_FULL` is the ODS's (EQ-2). `ISNULL` around every part so a missing lookup row never drops the device (C-8). | Closed |
| E-4 | The wing a device is grouped under (`IdntWing`) | `A_LOCATION` | The logical wing of `SP_AVIV_GET_LOCATIONS` (`CalcParent`): the location's parent is a wing (`CODE_SUG_LOCATION = 3330017`) → `LOCAT.IDNT_WING`; otherwise – a real location directly under the institute, or a virtual location – the agreed virtual wing **`99999`** ("מיקומים שונים"). Relies on `GetInstitutionsAndWings` returning that wing for every institute with `IsVirtualContainer = 1` (owner: "נכון"). The client groups by this value in the institute's wing order. | Closed |
| E-5 | Which devices | `AVIV_DEVICE_DATA` | Active only (`LOGI_ACTIVE = 1`): the picker must not offer a removed device. The location's own activity (`LOGI_PAIL`) is not filtered (EQ-4). | Closed |
| E-6 | Shape of the response | – | **Flat; the row is the DTO.** `DeviceDto { IdntDevice, TextDeviceName, IdntWing, IdntInstitution }`, filled by Dapper and returned as **the bare list** (E-12), exactly like `UnifiedLocationDto`. No assembler, no row class: four scalars, no id / name pair to type, nothing merged from elsewhere. (The trainees list is nested for the opposite reasons, L-7.) `IdntInstitution` is kept although the client reads it nowhere today: it is the cache key and costs nothing. | Closed |
| E-7 | Request contract | – | `DeviceRequestDto(int[] IdntInstitutionList, int[] IdntWingList)`, the semantics of `SP_AVIV_GET_LOCATIONS`: a device is included when its institute is requested **or** its logical wing is; a wing whose institute is requested is dropped. Check (E-12, L-15): at least one list non-empty, otherwise `400` from the controller; `null` lists and duplicates normalized by `ProcedureParameters.AddIdList`. No `clientIds`, no permission check (D-17). | Closed |
| E-12 | **Reads follow the shape of `reference/service` (Locations)** – the owner's review of the written code, 2026-11-10 | – | As L-15 of the trainees list, and one step further: **no orchestrator** – the controller takes `IDevicesRepository` directly, because nothing happens between them (the owner: "Devices ו-Lookups, צריכים Orchestrator ו-Validator? נראה לי קצת מוגזם"). Controller: one-line `isEmpty` check → `BadRequest`, `try/catch` → `500` with a plain-text body, `Ok(list)`. One DTO file (`Models/Devices/DeviceDto.cs`: request record + `DeviceDto`), like `WingDto.cs`. No validator, no `…RequestFields`, no `ApiActionRunner`, no wrapper. The owner kept Devices and Lookups as **separate** controllers (a "GeneralData" merge was weighed and declined). The repository does not catch (A-6). The first version (orchestrator + validator + two model files + runner) was written and removed the same day. | Closed |
| E-8 | **Histories and the permit lookup return device ids only** (amends I-15 of 04 and its V row in 03) | `AVIV_PERMITS_DEVICE`, `AVIV_DEVICE_DATA` | The device set of `SP_AVIV_GET_TRAINEE_RESTRICTIONS` (2), `SP_AVIV_GET_TRAINEE_NUMBER_RESTRICTIONS_AND_PERMITS` (3) and `SP_AVIV_GET_RESTRICTIONS_FOR_PERMIT` (4) returns `ConditionsRowId, DeviceId` – no `LEFT JOIN AVIV_DEVICE_DATA`, no `TEXT_DEVICE_NAME` (a column that most likely never existed, Q-9). `DeviceRow` loses `DeviceName`; `RecordPartsAssembler.ToDevices` becomes `ToDeviceIds : List<int>`; `TraineeRestrictionRecordDto`, `TraineePhoneRecordDto`, `ExistingPermitDto` carry `IdntDeviceList: List<int>` instead of `Devices: List<LookupItemDto>` – symmetric with the save requests. **The client resolves names from the institute's devices list it already caches** (prefetched after the trainees list; loaded on demand in a record screen through `useInstituteDevices`); a device that is not in the list – removed, `LOGI_ACTIVE = 0` – is shown with the fallback **"מכשיר {id} – לא פעיל"** (wording proposed, pending-decisions). Weighed and rejected: repeating the name expression in three procedures under an identical header (A-3 – three copies of ~10 lines), a `VIEW` (a new DB object), and returning inactive devices with an `IsActive` flag (owner: "יכול מאוד לנפח את הרשימה, ורק בשביל מקרה קצה"). | Closed |
| E-9 | Test data | `AVIV_DEVICE_DATA` | **None in this folder.** The owner populates `AVIV_DEVICE_DATA` with real devices; the checklist runs the procedure against a development institute and checks the three cases (under a wing / not under a wing / virtual) by eye. | Closed |
| E-10 | Order of the result | – | `ORDER BY IdntInstitution, IdntWing, IdntDevice`: the picker's groups come out contiguous and the SSMS grid is stable. The client orders the groups by the institute's wing order anyway. | Adopted |
| E-11 | Names | – | Procedure `SP_AVIV_GET_DEVICES` (A-15); controller `DevicesController`, route `api/Devices`, action `GetInstituteDevices` – the client's path (A-7). Parameters `@IDNT_INSTITUTION_LIST`, `@IDNT_WINGS_LIST` as in `SP_AVIV_GET_LOCATIONS` and `SP_AVIV_GET_TRAINEES`. The procedure name says "devices", not "institute devices", because the wings list filters too. | Closed |

## EI – implementation notes (phase 3)

| ID | Decision | Why |
|---|---|---|
| EI-1 | The logical wing of a real location is computed in a `CROSS APPLY (SELECT CASE …) AS LogicalWing`, the shape of `CalcParent` in the reference, and used both in the `INSERT` list and in the `WHERE`. | The alias is needed twice; a `CASE` repeated in the `WHERE` would be the same rule written twice. The owner pointed at `CalcParent` as the model. |
| EI-2 | `#Devices.TextLocationFullName` is `NVARCHAR(500)`; `TEXT_NAME_FULL` is stored as is and the institute prefix of a virtual location is composed at insert time, so the final `SELECT` adds only the `מכשיר N, ` prefix. | One composition rule per case, in the step of that case; the result step treats both cases alike. |
| EI-3 | The three 03 / 04 procedures keep their `WHERE PERMIT_DEVICE.LOGI_ACTIVE = 1` and the keys they had; only the join and the name column go. | E-8 is a removal, not a redesign; the smoke tests of 03 / 04 §F.4 re-verify them. |
| EI-4 | `DeviceRequestDto` and `DeviceDto` sit together in `Models/Devices/DeviceDto.cs`; there is no row class and no `Rows` file. | E-6, E-12: one file per domain like `WingDto.cs`; a `Rows` file with the DTO in it would mislead. |

## V – decisions of 03 and 04 verified for the devices list

| id | Short form | Here | Note |
|---|---|---|---|
| D-2, D-3 | Devices hang on the conditions row / the permit | Verified | `AVIV_PERMITS_DEVICE` keyed by `ConditionsRowId` stays; only the name goes (E-8) |
| D-17 | No permission check | Verified | E-7 |
| B-5 | No paging | Verified | One list per institute, cached in the client (spec 00 §6) |
| A-1 | No indexes; `DISTINCT` on device ids in the save procedures | Verified | Unchanged |
| A-3 | One self-contained procedure; repeated blocks under identical headers | Verified | The input block shared with `SP_AVIV_GET_TRAINEES` |
| A-4 | Result sets assembled in the service | Not applicable | One flat set (E-6) |
| A-6, A-7, A-16 | No catch in the repository; DB-style names; `QueryMultiple` + TVP | Verified | |
| A-11, A-12, A-13, A-14 | Shared `RunAsync`, validator, structured error body, wrapped responses | **Not applied to reads** (E-12, L-15) | Controller in the `LocationsController` shape; plain-text 400 / 500; bare list; recorded difference from the 03 / 04 histories |
| A-15 | Procedure names speak the tables' vocabulary | Verified | E-11 |
| C-8 | Empty names when a lookup row is missing | Verified, **extended** | `ISNULL` on every name part (E-3); in the histories the name is now the client's responsibility with the fallback text (E-8) |
| G-1 … G-5 | Guidelines | Verified | |
| I-4 | Normalized request copy | Not applicable (E-12) | `ProcedureParameters.AddIdList` normalizes `null` and duplicates |
| I-15 | Device and institute names joined in the read procedures | **Amended** | Devices: ids only, name built in `SP_AVIV_GET_DEVICES` (E-8). Institutes: unchanged (04 set 2 / set 4 keep their `A_LOCATION` join); the same institute join serves the virtual-location name here (E-3) |
| I-16, T-13 | Layout: `Models/Devices/`, `Services/Devices/`; flat `Utils/` | Verified | No `Rows` file (EI-4) |
| I-19 | Flags from the procedure | Not applicable | No flags; `IdntWing` is a key, not a flag |
| I-20 | No placeholder fields | Verified | `IdntInstitution` is real data (E-6) |
| T-12 | Shared code lives once | Verified | `DeviceRow`, `RecordPartsAssembler` change once for both features (E-8) |
| Q-7 | `Devices/GetInstituteDevices` – deferred | **Closed by this query** | |
| Q-9 | Device name column (`TEXT_DEVICE_NAME`) to confirm | **Closed**: no name column; composed (E-3) | The 03 / 04 checklists' A.7 device query is superseded |

## C – client changes deferred

Applied in the client on 2026-11-10, in step ד of the same session.

| ID | Change | Where to start in the client |
|---|---|---|
| EC-1 | `DeviceDto` → `{ idntDevice, textDeviceName, idntWing, idntInstitution }`; the request → `{ idntInstitutionList, idntWingList }`; the response is a bare array (`DeviceDto[]`, E-12); `buildDeviceOptions` groups by `idntWing`, labels by `textDeviceName`; the cache key stays the institute | `src/types/organization.schema.ts`, `devicesService.ts`, `features/institutes/organizationLogic.ts`, the devices field of the forms |
| EC-2 | The 03 / 04 records carry `idntDeviceList: number[]` instead of `devices: LookupItem[]` (`PermittedCallConditionsDto`); the cards and the permit picker resolve names through the cached devices of the record's institute (`useInstituteDevices`), with the fallback "מכשיר {id} – לא פעיל" for an id not in the list; a record screen opened directly (deep link) loads the devices on demand | `src/types/common.schema.ts`, `callConditionsLogic.ts` (`buildPermittedDevicesValue`), `sourceRestrictionPickerLogic.ts`, `numberRestrictionsLogic.ts`, `traineeRestrictionsLogic.ts`, the 03 / 04 mock data and handlers, `.agent/pending-decisions.md` (the fallback wording) |
| EC-3 | `devicesMockData.ts` regenerated in the new shape and name format ("מכשיר 1, הדר, אגף א, חדר 3"; virtual: "מכשיר 4, הדר, משרד"); `handleGetInstituteDevices` filters by the two lists | `src/mock-server/data/devicesMockData.ts`, `src/mock-server/handlers/lookupsHandlers.ts` |

## Q – open items

| ID | Question | Tables | Needed for | Status |
|---|---|---|---|---|
| EQ-1 | Do the id spaces of `A_LOCATION.IDNT_LOCATION_TRAINEE` and `AVIV_VIRTUAL_WING_DATA.IDNT_WING` overlap? If an id exists in both, a device on it would appear twice (the `PRIMARY KEY` of `#Devices` would then fail the second insert – a loud failure, by design). `SP_AVIV_GET_LOCATIONS` makes the same assumption. One `INTERSECT` query in the checklist. | `A_LOCATION`, `AVIV_VIRTUAL_WING_DATA` | procedure | Open – checklist |
| EQ-2 | `TEXT_NAME_FULL`: what is the separator inside it, and does it begin with the institute's name? If it does not, the institute name is prefixed for real locations too (one line in step 2, the same prefix virtual locations get). | `A_LOCATION` | display name | Open – checklist |
| EQ-3 | A device whose `IDNT_LOCATION` is in neither table (orphan) is not returned. Should the checklist count them? Proposed: yes, as a data-quality query, no code change. | `AVIV_DEVICE_DATA` | – | Open – checklist |
| EQ-4 | A device on a real location with `LOGI_PAIL = 0` (closed location) is returned while the device itself is active. Hide it? Today: no (the device's own flag decides, E-5); revisit if the owner sees stale rooms in the picker. | `A_LOCATION`, `AVIV_DEVICE_DATA` | picker | Open |
