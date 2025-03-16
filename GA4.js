const fetch = require("node-fetch");
const os = require("os");
const package_self = require('./package.json');
const { app } = require("electron");
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const path = require('path');
const crypto = require('crypto');

const globalConfigDir = app.getPath('userData');
const globalConfigPath = path.join(globalConfigDir, 'config.json');

const isElectron = process.versions && process.versions.electron !== undefined;  // 检测是否在 Electron 环境中
const electronVersion = isElectron ? process.versions.electron : "N/A";  // 获取 Electron 版本

const MEASUREMENT_ID = "G-23VH4CNT3L";
const API_SECRET = "uXrrxeI3SSCmsJcOIRG-yg";

const GA4 = {
  getClientId: function () {
    const config = existsSync(globalConfigPath) ? JSON.parse(readFileSync(globalConfigPath, 'utf-8')) : {};
    const old_uuid = config.client_uuid;
    config.client_uuid = old_uuid || crypto.randomUUID();
    if (!old_uuid) {
      existsSync(!globalConfigDir) && mkdirSync(globalConfigDir);
      writeFileSync(globalConfigPath, JSON.stringify(config), { encoding: 'utf-8' });
    }
    return config.client_uuid;
  },
  sendEvent: async function (eventName, params = {}) {
    const clientId = this.getClientId();
    const eventData = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: {
            os: os.platform(),
            username: os.userInfo().username,
            hostname: os.hostname(),
            node_version: process.version,
            version: package_self.version,
            electron_version: electronVersion,
            ...params,
          }
        }
      ]
    };

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        console.log(`✅ Event '${eventName}' sent successfully`);
      } else {
        console.error(`❌ Failed to send event '${eventName}':`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error sending event '${eventName}':`, error);
    }
  }
};

module.exports = GA4;
