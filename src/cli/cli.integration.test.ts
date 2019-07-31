// tslint:disable max-classes-per-file no-console
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fs from "fs";
import * as _ from "lodash";
import "mocha";
import * as path from "path";

import { Configuration } from "../Configuration";

import { Cli } from "./cli";
import { createTempDir, deleteTempDir, LoggerMock } from "./cli.mock.integration.test";

chaiUse(chaiAsPromised);

describe("cli", function() {
    this.timeout(3000);

    let tempDir = "";
    beforeEach(async () => (tempDir = createTempDir()));
    afterEach(async () => await deleteTempDir(tempDir));

    const config: Configuration = {
        accountsCollection: "accounts",
        roleCollectionPrefix: "role_",
        roles: {
            admin: { manages: ["manager", "editor", "reviewer"] },
            manager: { manages: ["editor", "reviewer"] },
            editor: { manages: [] },
            reviewer: { manages: [] },
        },
    };

    const innerRules = `match /post/{uid} {}`;

    describe("Test with saving the file", () => {
        let configFile = "";
        let innerRulesFile = "";
        let outputFile = "";
        let logger: LoggerMock = new LoggerMock();
        const configContents = `module.exports = ${JSON.stringify(config)}`;
        beforeEach(async () => {
            configFile = path.resolve(tempDir, "config.js");
            innerRulesFile = path.resolve(tempDir, "inner.rules");
            outputFile = path.resolve(tempDir, "deploy.rules");

            fs.writeFileSync(configFile, configContents, "UTF-8");
            fs.writeFileSync(innerRulesFile, innerRules, "UTF-8");

            logger = new LoggerMock();
        });

        it("Saves rules to specified file", async () => {
            const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(0);
            expect(logger.stderr).to.be.equal("");
            expect(fs.existsSync(outputFile), "Output file exists").to.be.equal(true);
            const outputRead = fs.readFileSync(outputFile, "UTF-8");

            expect(outputRead).to.include(innerRules);
        });

        it("Prints usage on wrong cmd", async () => {
            const args = ["node", "cli-entrypoint.js", "nonexistent-cmd", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(1);
            expect(logger.stdout).to.include("Usage");
        });

        it("Prints usage on wrong no of arguments", async () => {
            const args = ["node", "cli-entrypoint.js", "generate"];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(1);
            expect(logger.stdout).to.include("Usage");
        });

        it("Prints to stderr on error (file doesnt exist)", async () => {
            const args = ["node", "cli-entrypoint.js", "generate", "nonexistent.config.f", innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(1);
            expect(logger.stderr)
                .to.be.a("string")
                .with.length.gt(0);
        });
    });
});