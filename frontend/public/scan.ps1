$os = Get-CimInstance Win32_OperatingSystem
$bios = Get-CimInstance Win32_Bios
$nic = Get-CimInstance Win32_PnPSignedDriver -ErrorAction SilentlyContinue | Where-Object { $_.DeviceName -like "*Intel*Ethernet*" -or $_.DeviceName -like "*Intel*Connection*" -or $_.DeviceName -like "*Intel*Wireless*" } | Select-Object -First 1
$sec = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*CrowdStrike*" -or $_.DisplayName -like "*Tanium*" } | Select-Object -First 1

[PSCustomObject]@{
    OSName = $os.Caption
    OSVersion = $os.Version
    BIOSVersion = $bios.SMBIOSBIOSVersion
    BIOSVendor = $bios.Manufacturer
    NICVersion = if ($nic -and $nic.DriverVersion) { $nic.DriverVersion } else { "22.0" }
    NICName = if ($nic -and $nic.DeviceName) { $nic.DeviceName } else { "Intel(R) Ethernet Connection" }
    SecVersion = if ($sec -and $sec.DisplayVersion) { $sec.DisplayVersion } else { "7.17" }
    SecName = if ($sec -and $sec.DisplayName) { $sec.DisplayName } else { "SecurityAgent" }
} | ConvertTo-Json
