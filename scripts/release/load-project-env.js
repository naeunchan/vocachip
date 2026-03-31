#!/usr/bin/env node
/* eslint-env node */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}

function resolveProfile(env = process.env) {
    const appEnv = clean(env.APP_ENV).toLowerCase();
    if (appEnv) {
        return appEnv;
    }

    const nodeEnv = clean(env.NODE_ENV).toLowerCase();
    if (nodeEnv) {
        return nodeEnv;
    }

    return "development";
}

function getEnvFilePriority(profile) {
    const files = [];

    if (profile === "production") {
        files.push(".env.release.local", ".env.release");
    }

    if (profile && profile !== "development") {
        files.push(`.env.${profile}.local`, `.env.${profile}`);
    }

    files.push(".env.local", ".env");

    return [...new Set(files)];
}

function loadProjectEnv({ rootDir = process.cwd() } = {}) {
    const profile = resolveProfile();
    const loadedFiles = [];

    for (const relativePath of getEnvFilePriority(profile)) {
        const filePath = path.join(rootDir, relativePath);
        if (!fs.existsSync(filePath)) {
            continue;
        }

        dotenv.config({
            path: filePath,
            override: false,
            quiet: true,
        });
        loadedFiles.push(relativePath);
    }

    return { profile, loadedFiles };
}

module.exports = {
    getEnvFilePriority,
    loadProjectEnv,
    resolveProfile,
};
