$RuleName = "Allow-PPTX-Translate-Docker"
$Ports = @(5193, 5001, 11434)

Write-Host "--- Windows Firewall Configurator ---" -ForegroundColor Cyan

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Please run this script as ADMINISTRATOR!"
    exit
}

if (Get-NetFirewallRule -Name $RuleName -ErrorAction SilentlyContinue) {
    Remove-NetFirewallRule -Name $RuleName
    Write-Host "Removed existing rule."
}

New-NetFirewallRule -DisplayName "PPTX Translate (Docker Share)" `
    -Name $RuleName `
    -Direction Inbound `
    -LocalPort $Ports `
    -Protocol TCP `
    -Action Allow `
    -Description "Allows LAN access to PPTX Translate frontend and backend."

$ip = ([System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName()).AddressList | Where-Object { $_.AddressFamily -eq 'InterNetwork' } | Select-Object -First 1).IPAddressToString
Write-Host "SUCCESS: Ports $($Ports -join ', ') are now open." -ForegroundColor Green
Write-Host "Share URL: http://$($ip):5193" -ForegroundColor Yellow
