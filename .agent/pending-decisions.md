# Pending Decisions and Open Questions

This document compiles features, rules, or implementation details explicitly designated by the user as "undecided," "to be addressed later," or "open questions," together with open questions that come up during development.

## 🏗️ Architecture and Logic
| Date | Topic/Screen | Description | Impact / Blocked Items |
|---|---|---|---|
| 2026-10-17 | 01 Trainees list – Trainees call | The Trainees POST does not exist in Aviv_Service yet; the contract is approximate (action name `Trainees/GetTrainees`, request `instituteIds` + optional `wingIds`). | `SERVICE_ENDPOINTS.trainees`, `GetTraineesRequest`, mock route. Update once the service defines it |
| 2026-10-17 | 01 Trainees list – institute selected | The user said there will be one more call after an institute is selected. Not defined yet. | Spec 01 §6.2 lists it as a placeholder |
| 2026-10-17 | Platform – screen size detection | Deferred ("not now"): no screen-size / device-type detection while the app is mobile only. | Revisit when tablet / desktop work starts |
| 2026-10-17 | Organization – virtual flags | Business meaning of `WingDto.isVirtualContainer`, `WingLocationDto.isVirtual` and `hasDevice` is not defined. They are typed and mocked but no UI logic uses them. | Wing / location filters, future device-related screens |
| 2026-10-17 | Organization – response shapes | Confirm against Aviv_Service whether `GetInstitutionsAndWings` and `GetLocationsAndVirtualLocations` return the wrapped shapes (`{ institutes }`, `{ locations }`) or bare arrays, and how GET array params (`clientIds`) are serialized. | `organization.schema.ts`, services |
| 2026-10-17 | 05 Voice messages – schema | `voice-messages.schema.ts`, referenced by spec 00 §7, does not exist. No voice-message mock data can be built, and the trainee message flags (`hasActiveMessage`, `hasActiveInteractiveMessage`) are static mock values. | Voice message mock data and screens 05 |
| 2026-10-18 | 01 Trainees list – photo call | The trainee photo comes from a separate call that returns the image itself. Its name (`Trainees/GetTraineePhoto`) and parameter (`traineeId`) are placeholders. | `SERVICE_ENDPOINTS.trainees.getTraineePhoto`, `GetTraineePhotoRequest` |
| 2026-10-18 | Infrastructure – `http().getUri` | The photo URL is built with `http().getUri({ url, params })` (axios API), so it includes the service base URL. Confirm the internal library exposes it; otherwise adapt only `serviceClient.buildServiceUrl`. | `src/infrastructure/api/serviceClient.ts` |
| 2026-10-18 | 01 Trainees list – trainees without a photo | Each card requests a photo; a trainee without one shows the placeholder after a failed load (404). Should the trainees response flag `hasPhoto`, to skip those requests? | `TraineeListItemDto`, `TraineePhoto` |

## 🎨 Design and User Experience (UX)
| Date | Topic/Screen | Description | Impact / Blocked Items |
|---|---|---|---|
| 2026-10-18 | 01 Trainees list – multi-select text | Wording of the multi-select field for several selected items: `"{n} נבחרו"`. Confirm. | `traineesListTexts.ts` |
| 2026-10-17 | Icons – image files | Icons served as `<img src>` from storage do not inherit the text color, so any colored icon state needs its own image file. (The active-filter state is a separate dot, so it is not affected.) | `src/shared/icons/appIcons.ts` |
| 2026-10-17 | 01 Trainees list – state texts | Confirm the new state texts proposed for loading / empty / error (institutes, permissions toast, locations, error screen) – marked "(proposed)" in spec 01 §7. | Texts files of institutes, trainees and errors |
