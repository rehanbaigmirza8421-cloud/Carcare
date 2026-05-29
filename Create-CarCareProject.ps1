$root = "carcare-management"

$folders = @(
    "$root\backend\src\config",
    "$root\backend\src\controllers",
    "$root\backend\src\middleware",
    "$root\backend\src\models",
    "$root\backend\src\routes",
    "$root\backend\src\services",
    "$root\backend\src\utils",

    "$root\frontend\public",

    "$root\frontend\src\api",
    "$root\frontend\src\assets\images",
    "$root\frontend\src\assets\icons",
    "$root\frontend\src\assets\logos",

    "$root\frontend\src\components\Navbar",
    "$root\frontend\src\components\Sidebar",
    "$root\frontend\src\components\Footer",
    "$root\frontend\src\components\Loader",
    "$root\frontend\src\components\Modal",
    "$root\frontend\src\components\DataTable",
    "$root\frontend\src\components\ThemeSwitcher",

    "$root\frontend\src\layouts",

    "$root\frontend\src\pages\Dashboard",
    "$root\frontend\src\pages\VehicleEntry",
    "$root\frontend\src\pages\Billing",
    "$root\frontend\src\pages\Quotation",
    "$root\frontend\src\pages\FreeCoating",
    "$root\frontend\src\pages\Settings",
    "$root\frontend\src\pages\Login",

    "$root\frontend\src\context",
    "$root\frontend\src\hooks",
    "$root\frontend\src\routes",
    "$root\frontend\src\styles",

    "$root\docs"
)

$files = @(
    # Backend
    "$root\backend\.env",
    "$root\backend\package.json",
    "$root\backend\README.md",

    "$root\backend\src\config\db.js",
    "$root\backend\src\config\settings.js",

    "$root\backend\src\controllers\authController.js",
    "$root\backend\src\controllers\vehicleController.js",
    "$root\backend\src\controllers\billingController.js",
    "$root\backend\src\controllers\quotationController.js",
    "$root\backend\src\controllers\freeCoatingController.js",
    "$root\backend\src\controllers\dashboardController.js",

    "$root\backend\src\middleware\authMiddleware.js",
    "$root\backend\src\middleware\errorMiddleware.js",
    "$root\backend\src\middleware\loggerMiddleware.js",

    "$root\backend\src\models\User.js",
    "$root\backend\src\models\Vehicle.js",
    "$root\backend\src\models\Billing.js",
    "$root\backend\src\models\Quotation.js",
    "$root\backend\src\models\FreeCoating.js",
    "$root\backend\src\models\Settings.js",

    "$root\backend\src\routes\authRoutes.js",
    "$root\backend\src\routes\vehicleRoutes.js",
    "$root\backend\src\routes\billingRoutes.js",
    "$root\backend\src\routes\quotationRoutes.js",
    "$root\backend\src\routes\freeCoatingRoutes.js",
    "$root\backend\src\routes\dashboardRoutes.js",
    "$root\backend\src\routes\settingsRoutes.js",

    "$root\backend\src\services\billingService.js",
    "$root\backend\src\services\quotationService.js",
    "$root\backend\src\services\dashboardService.js",

    "$root\backend\src\utils\invoiceGenerator.js",
    "$root\backend\src\utils\quotationGenerator.js",
    "$root\backend\src\utils\helper.js",

    "$root\backend\src\app.js",
    "$root\backend\src\server.js",

    # Frontend
    "$root\frontend\package.json",
    "$root\frontend\README.md",

    "$root\frontend\src\api\axios.js",
    "$root\frontend\src\api\billingApi.js",
    "$root\frontend\src\api\vehicleApi.js",
    "$root\frontend\src\api\quotationApi.js",
    "$root\frontend\src\api\settingsApi.js",

    "$root\frontend\src\layouts\MainLayout.jsx",
    "$root\frontend\src\layouts\AuthLayout.jsx",

    "$root\frontend\src\pages\Dashboard\Dashboard.jsx",

    "$root\frontend\src\pages\VehicleEntry\VehicleList.jsx",
    "$root\frontend\src\pages\VehicleEntry\AddVehicle.jsx",

    "$root\frontend\src\pages\Billing\BillingList.jsx",
    "$root\frontend\src\pages\Billing\CreateBill.jsx",
    "$root\frontend\src\pages\Billing\PrintInvoice.jsx",

    "$root\frontend\src\pages\Quotation\QuotationList.jsx",
    "$root\frontend\src\pages\Quotation\CreateQuotation.jsx",
    "$root\frontend\src\pages\Quotation\PrintQuotation.jsx",

    "$root\frontend\src\pages\FreeCoating\FreeCoatingList.jsx",
    "$root\frontend\src\pages\FreeCoating\AddFreeCoating.jsx",

    "$root\frontend\src\pages\Settings\GeneralSettings.jsx",
    "$root\frontend\src\pages\Settings\ThemeSettings.jsx",
    "$root\frontend\src\pages\Settings\CompanySettings.jsx",

    "$root\frontend\src\pages\Login\Login.jsx",

    "$root\frontend\src\context\AuthContext.jsx",
    "$root\frontend\src\context\ThemeContext.jsx",

    "$root\frontend\src\hooks\useAuth.js",
    "$root\frontend\src\hooks\useTheme.js",

    "$root\frontend\src\routes\AppRoutes.jsx",

    "$root\frontend\src\styles\globals.css",
    "$root\frontend\src\styles\dark-theme.css",
    "$root\frontend\src\styles\light-theme.css",

    "$root\frontend\src\App.jsx",
    "$root\frontend\src\main.jsx",

    # Docs
    "$root\docs\SOP.md",
    "$root\docs\API-Documentation.md",
    "$root\docs\Database-Design.md",

    # Root
    "$root\package.json"
)

Write-Host "Creating folders..."

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

Write-Host "Creating files..."

foreach ($file in $files) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

Write-Host ""
Write-Host "======================================="
Write-Host " Car Care Project Structure Created"
Write-Host "======================================="
Write-Host ""
Write-Host "Location:"
Write-Host (Resolve-Path $root)