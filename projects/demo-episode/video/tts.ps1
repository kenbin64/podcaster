# Speaks the demo script with Windows' built-in voice, and records when each word starts (bookmarks).
Add-Type -AssemblyName System.Speech
$items = Get-Content -Raw items.json | ConvertFrom-Json
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft David Desktop')
$synth.Rate = -1
$pb = New-Object System.Speech.Synthesis.PromptBuilder
foreach ($it in $items) {
  if ($null -ne $it.break) { $pb.AppendBreak([TimeSpan]::FromMilliseconds([int]$it.break)) }
  else { $pb.AppendBookmark('w' + $it.k); $pb.AppendText([string]$it.word) }
}
$global:marks = New-Object System.Collections.Generic.List[string]
$synth.add_BookmarkReached({ param($s, $e) $global:marks.Add($e.Bookmark.Substring(1) + ':' + [int]$e.AudioPosition.TotalMilliseconds) })
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$synth.SetOutputToWaveFile((Join-Path $PWD 'narration.wav'), $fmt)
$synth.Speak($pb)
$synth.SetOutputToNull()
($global:marks -join "`n") | Set-Content -Encoding ascii marks.txt
"words timed: " + $global:marks.Count
