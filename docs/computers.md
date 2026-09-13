# Computers

Each folk chooses where visual work runs:

| Destination | Meaning |
|-------------|---------|
| **This computer** | Host desktop (OS permission gates on Mac / Windows / Linux) |
| **Local VM** | Isolated Linux desktop via Docker / Podman / WSL — **Settings → Local VM** |
| **Off** | No computer for that folk |
| **Cloud (Advanced)** | Hosted Box or a self-hosted VPS |

Auto (unset) keeps server-side selection. The picker shows a short helper, not a platform essay.

Code:

- Desk picker: `apps/desk/components/ComputerDestinationPicker.tsx`
- Local VM settings: `apps/desk/components/LocalComputerSection.tsx`
- Routing stays in `apps/harness`
