# OpenFolks

OpenFolks is a free, open-source desktop app for working with a team of AI agents. You create **folks**, give each one a model, a working folder and a computer, assign them work in a chat window, and review what they did. Your conversations and files are stored on your own computer.

## Features

**Folks**
- A folk is a long-lived teammate with its own instructions, model, voice, working folder, memory, tools and computer.
- Each conversation with a folk is a task, with its own transcript, approvals, costs and state.
- Send a message while a folk is busy and it is queued; supported engines can also be steered mid-turn.
- Edit, branch, rewind, pin, reply to and export any conversation.

**Rooms and crews**
- Put several folks in one room to share a brief and hand work to each other.
- Install a ready-made crew from the Marketplace: Dev Crew, Job Search, Sales Pipeline, Research Desk or Content Studio.

**Computers**
- Run a folk on your own computer (an explicit opt-in, chosen per folk), in an isolated Local VM through Docker or Podman, on a hosted cloud computer, or on a server you own over SSH.
- Watch a folk work through a live preview, and take over where the backend supports it.

**Routines and webhooks**
- Run a task once, on selected weekdays, or when a webhook arrives.
- Every run starts with fresh context and leaves a receipt.

**Memory and voice**
- Each folk keeps plain-text memory that you can read, edit and delete.
- Spoken replies and per-folk voices through ElevenLabs; on macOS, on-device dictation and call mode.

**Connected apps and tools**
- Connect Gmail, GitHub, Slack, Notion and many other services, with several labelled accounts per service.
- Attach your own tools through MCP.

**Oversight**
- Risky actions appear as approval cards in the conversation.
- Backstage shows the live record of each turn: tool calls, requests and errors.
- Per-task token and cost visibility.

**Engines**
- Folks run through the agent tools you already use, such as Claude and Codex, or through a local model.

Data is stored in `~/.openfolks`. Set `OPENFOLKS_DATA_DIR` to use another location.

## Download

Installers are published on the [latest release](https://github.com/manasdutta04/openfolks/releases/latest).

[![Download for Windows](https://img.shields.io/badge/Windows-Download-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks-setup.exe)
[![Download for macOS (Apple silicon)](https://img.shields.io/badge/macOS-Apple%20silicon-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks.dmg)
[![Download for macOS (Intel)](https://img.shields.io/badge/macOS-Intel-555555?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks-intel.dmg)
[![Download for Linux (.deb)](https://img.shields.io/badge/Linux-.deb-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks-amd64.deb)
[![Download for Linux (AppImage)](https://img.shields.io/badge/Linux-AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks.AppImage)

| System | File |
|---|---|
| Windows 10 and 11 (x64) | [OpenFolks-setup.exe](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks-setup.exe) |
| macOS, Apple silicon | [OpenFolks.dmg](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks.dmg) |
| macOS, Intel | [OpenFolks-intel.dmg](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks-intel.dmg) |
| Ubuntu 24.04 (x64) | [OpenFolks-amd64.deb](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks-amd64.deb) or [OpenFolks.AppImage](https://github.com/manasdutta04/openfolks/releases/latest/download/OpenFolks.AppImage) |

The installers are not signed with an Apple or Microsoft certificate, so your system asks you to confirm the first time you open the app:

- **Windows:** in SmartScreen, choose **More info**, then **Run anyway**.
- **macOS:** after copying the app to Applications, run `xattr -cr /Applications/OpenFolks.app`, or right-click the app and choose **Open**.
- **Linux:** install the package with `sudo apt install ./OpenFolks-amd64.deb`.

Each release includes `SHA256SUMS.txt` so you can check your download.

## License

OpenFolks is released under the [MIT License](LICENSE). Third-party notices are in [NOTICE](NOTICE).
