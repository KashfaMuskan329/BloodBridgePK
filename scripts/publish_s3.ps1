param([Parameter(Mandatory=$true)][string]$Bucket,[string]$Region='ap-south-1')
$ErrorActionPreference='Stop'
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw 'AWS CLI is not installed.' }
Write-Host 'Make sure your AWS account has a budget alert and that the bucket name is globally unique.'
aws s3api head-bucket --bucket $Bucket 2>$null
if ($LASTEXITCODE -ne 0) {
  aws s3api create-bucket --bucket $Bucket --region $Region --create-bucket-configuration LocationConstraint=$Region
  if ($LASTEXITCODE -ne 0) { throw 'Bucket creation failed.' }
}
aws s3 cp .\app\data\centers.geojson "s3://$Bucket/bloodbridge/centers.geojson" --region $Region --sse AES256
if ($LASTEXITCODE -ne 0) { throw 'S3 upload failed.' }
Write-Host 'Download source of truth to show a real AWS S3 build pipeline:'
aws s3 cp "s3://$Bucket/bloodbridge/centers.geojson" .\app\data\centers.geojson --region $Region
if ($LASTEXITCODE -ne 0) { throw 'S3 download failed.' }
python .\scripts\embed_dataset.py
if ($LASTEXITCODE -ne 0) { throw 'Embedding failed.' }
Write-Host 'Dataset round-trip S3 -> local build verified. Keep the bucket PRIVATE.'
