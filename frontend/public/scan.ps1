$os = Get-CimInstance Win32_OperatingSystem
$bios = Get-CimInstance Win32_Bios

# 1. Dynamically get active network adapter and its driver version
$activeAdapter = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1
$nic = $null
if ($activeAdapter) {
    $nic = Get-CimInstance Win32_PnPSignedDriver -ErrorAction SilentlyContinue | Where-Object { $_.DeviceName -eq $activeAdapter.InterfaceDescription } | Select-Object -First 1
}
if (-not $nic) {
    # Fallback to any network driver if active not found
    $nic = Get-CimInstance Win32_PnPSignedDriver -ErrorAction SilentlyContinue | Where-Object { $_.DeviceName -like "*Ethernet*" -or $_.DeviceName -like "*Wireless*" -or $_.DeviceName -like "*Network*" -or $_.DeviceName -like "*Intel*" } | Select-Object -First 1
}

# 2. Dynamically get installed security products from HKLM or SecurityCenter2
$sec = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*CrowdStrike*" -or $_.DisplayName -like "*Tanium*" } | Select-Object -First 1
if (-not $sec) {
    # Check registered antivirus products in Windows Security Center
    $av = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($av) {
        $sec = [PSCustomObject]@{
            DisplayName = $av.displayName
            DisplayVersion = "1.0.0"
        }
    }
}

# 3. Output JSON payload
[PSCustomObject]@{
    OSName = $os.Caption
    OSVersion = $os.Version
    BIOSVersion = $bios.SMBIOSBIOSVersion
    BIOSVendor = $bios.Manufacturer
    NICVersion = if ($nic -and $nic.DriverVersion) { $nic.DriverVersion } else { "Unknown" }
    NICName = if ($nic -and $nic.DeviceName) { $nic.DeviceName } else { "NetworkAdapter" }
    SecVersion = if ($sec -and $sec.DisplayVersion) { $sec.DisplayVersion } else { "Unknown" }
    SecName = if ($sec -and $sec.DisplayName) { $sec.DisplayName } else { "SecurityAgent" }
} | ConvertTo-Json
