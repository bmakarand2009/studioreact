#!/bin/bash
#  Script to fix all router. calls to navigate calls and href to to

# Replace router.push with navigate
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/router\.push(/navigate(/g' {} +

# Replace router.replace with navigate(..., { replace: true })
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/router\.replace(\([^)]*\))/navigate(\1, { replace: true })/g' {} +

# Replace router.back with navigate(-1)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/router\.back()/navigate(-1)/g' {} +

# Replace <Link href= with <Link to=
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/<Link href=/<Link to=/g' {} +

# Replace href= in Link component props
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\bhref={/to={/g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\bhref="/to="/g' {} +

echo "Fixed all router navigation calls and Link href props"
