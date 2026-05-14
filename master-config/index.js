const projectConfig = require('./excell/project.config');
const vehicleConfig = require('./excell/vehicle-master.config');
const locationConfig = require('./excell/location-master.config');
const driverConfig = require('./excell/driver-master.config');
const checklistConfig = require('./excell/checklist-setup.config');
const chartOfAccountConfig = require('./excell/chart-of-account.config');
const itemConfig = require('./excell/item-master.config');
const businessPartnerConfig = require('./excell/business-partner-master.config');
const partsTypeConfig = require('./excell/parts-type.config');
const tripExpenseSetupConfig = require('./excell/trip-expense-setup.config');
const routeMasterConfig = require('./excell/route-master.config');
const maintenanceTypeConfig = require('./excell/maintenance-type.config');

module.exports = {
    project: projectConfig,
    vehicle: vehicleConfig,
    location: locationConfig,
    driver: driverConfig,
    checklist: checklistConfig,
    chartOfAccount: chartOfAccountConfig,
    item: itemConfig,
    businessPartner: businessPartnerConfig,
    partsType: partsTypeConfig,
    tripExpenseSetup: tripExpenseSetupConfig,
    routeMaster: routeMasterConfig,
    maintenanceType: maintenanceTypeConfig
};