$os = Get-CimInstance Win32_OperatingSystem
$bios = Get-CimInstance Win32_Bios

$components = @()

$components += [PSCustomObject]@{
    type = "BIOS"
    vendor = if ($bios.Manufacturer) { $bios.Manufacturer } else { "Unknown" }
    version = if ($bios.SMBIOSBIOSVersion) { $bios.SMBIOSBIOSVersion } else { "Unknown" }
}

# Network Adapters (Excluding virtual/loopback adapters)
$nics = Get-CimInstance Win32_PnPSignedDriver -ErrorAction SilentlyContinue | Where-Object { $_.DeviceClass -eq "NET" -and $_.DeviceName -and $_.DriverVersion }
foreach ($nic in $nics) {
    if ($nic.DeviceName -notmatch "Virtual|Miniport|Loopback|Bluetooth|Teredo|ISATAP|PktMon|WAN|VPN") {
        $type = if ($nic.Manufacturer -match "Intel") { "Intel_NIC" } else { "NIC" }
        $components += [PSCustomObject]@{
            type = $type
            vendor = if ($nic.Manufacturer) { $nic.Manufacturer } else { "Unknown" }
            version = $nic.DriverVersion
        }
    }
}

# Security Products (Windows Security Center)
$avs = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction SilentlyContinue
if ($avs) {
    foreach ($a in $avs) {
        $components += [PSCustomObject]@{
            type = "SecurityAgent"
            vendor = $a.displayName
            version = "1.0.0"
        }
    }
}

# General Installed Software (Filtering out basic updates)
$software = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -and $_.DisplayVersion -and $_.DisplayName -notmatch "Update|Redistributable" }

# Deduplicate and limit to prevent massive payload issues
$uniqueSoftware = $software | Sort-Object DisplayName -Unique
$count = 0
foreach ($sw in $uniqueSoftware) {
    if ($count -lt 15) { 
        $type = if ($sw.DisplayName -match "CrowdStrike|Tanium|Sentinel|FireEye|Defender") { "SecurityAgent" } else { "Software" }
        $components += [PSCustomObject]@{
            type = $type
            vendor = if ($sw.Publisher) { $sw.Publisher } else { $sw.DisplayName }
            version = $sw.DisplayVersion
        }
        $count++
    }
}

[PSCustomObject]@{
    os = [PSCustomObject]@{
        name = $os.Caption
        version = $os.Version
        hostname = $env:COMPUTERNAME
    }
    components = $components
} | ConvertTo-Json -Depth 5
