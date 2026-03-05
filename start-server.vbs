Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\cygwin64\home\sulej\projects\quiz-projector"
WshShell.Run "cmd /c node server.js", 0, False
