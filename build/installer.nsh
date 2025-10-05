
!include "FileFunc.nsh"
!include "EnvVarUpdate.nsh"
!include "nsDialogs.nsh"

!macro customInstall
  ; Check PATH for ffmpeg
  nsExec::ExecToStack 'cmd /c where ffmpeg'
  Pop $0
  Pop $1

  ${If} $0 != 0
    SetOutPath "$LOCALAPPDATA\BBsVideoCMS\bin"
    File /oname=ffmpeg.exe "$INSTDIR\resources\bin\ffmpeg-static\ffmpeg.exe"
    File /oname=ffprobe.exe "$INSTDIR\resources\bin\ffprobe-static\windows\x64\ffprobe.exe"

    ${EnvVarUpdate} $0 "PATH" "A" "HKCU" "$LOCALAPPDATA\BBsVideoCMS\bin"
    System::Call 'USER32::SendMessageTimeoutA(i 0xffff, i ${WM_SETTINGCHANGE}, i 0, t "Environment", i 0x2, i 5000, *i .r1)'
  ${EndIf}
!macroend
