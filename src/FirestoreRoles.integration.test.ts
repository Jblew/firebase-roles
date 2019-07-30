// tslint:disable max-classes-per-file no-console
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { cleanupEach, getAccountRecord, mock, startupAll } from "./FirestoreRoles.mock.integration.test";
import { AccountRecord } from "./model/AccountRecord";
import { FirebaseAccount } from "./types/FirebaseAccount";
import { FirestoreRoles } from "./FirestoreRoles";

chaiUse(chaiAsPromised);

before("startup", function() {
    this.timeout(4000);
    startupAll();
});
afterEach(cleanupEach);

const config: Configuration.Optional = {
    roles: {
        admin: { manages: ["manager", "editor", "reviewer"] },
        manager: { manages: ["editor", "reviewer"] },
        editor: { manages: [] },
        reviewer: { manages: [] },
    },
};

describe("FirestoreRoles", () => {
    describe("registerUser", () => {
        it("Adds user to database", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedUser = await getAccountRecord(sampleAccountDoc);
            expect(obtainedUser.uid).to.be.equal(sampleAccount.uid);
        });

        it("Adds user with roles defined as empty array", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedAR = await getAccountRecord(sampleAccountDoc);
            expect(obtainedAR.roles)
                .to.be.an("array")
                .with.length(0);
        });

        it("Adds user with requested roles defined as empty array", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedAR = await getAccountRecord(sampleAccountDoc);
            expect(obtainedAR.requestedRoles)
                .to.be.an("array")
                .with.length(0);
        });
    });

    describe("setRoles", () => {
        it("Sets roles of account", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const setRoles: string[] = ["manager", "editor"];
            await roles.setRoles(sampleAccount.uid, setRoles);
            const gotRoles = await roles.getRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .that.has.members(setRoles);
        });

        it("Fails to set not defined role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const setRoles = ["nonexistent-role"];
            await expect(roles.setRoles(sampleAccount.uid, setRoles)).to.eventually.be.rejectedWith(
                "Expected string `e` `nonexistent-role`",
            );
        });

        it("Does not modify other properties of an account", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock(config);
            sampleAccount.displayName = "fancyDisplayName";
            sampleAccount.phoneNumber = "123654345";
            await roles.registerUser(sampleAccount);

            const setRoles = ["manager", "editor"];
            await roles.setRoles(sampleAccount.uid, setRoles);

            const gotAccount = await getAccountRecord(sampleAccountDoc);
            expect(gotAccount.displayName).to.be.equal(sampleAccount.displayName);
            expect(gotAccount.phoneNumber).to.be.equal(sampleAccount.phoneNumber);
        });
    });

    describe("getRoles", () => {
        it("Fails if account doesnt exist", async () => {
            const { roles } = mock(config);

            await expect(roles.getRoles("nonexistent-uid"))
                .to.eventually.be.rejectedWith("Account doesnt exist")
                .that.haveOwnProperty("firestoreRolesAccountDoesntExistError");
        });

        it("Returns empty array if account never had roles set up", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            const gotRoles = await roles.getRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .with.length(0);
        });

        it("Returns previously set roles", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const setRoles: string[] = ["manager", "admin"];
            await roles.setRoles(sampleAccount.uid, setRoles);
            const gotRoles = await roles.getRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .that.has.members(setRoles);
        });
    });

    describe("hasRoles", () => {
        async function setRoles(
            rolesToSet: string[],
        ): Promise<{ sampleAccount: FirebaseAccount; roles: FirestoreRoles }> {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            await roles.setRoles(sampleAccount.uid, rolesToSet);
            return { sampleAccount, roles };
        }

        it("Returns true if user has a role", async () => {
            const { sampleAccount, roles } = await setRoles(["admin"]);
            await expect(roles.hasRole(sampleAccount.uid, "admin")).to.eventually.be.true;
        });

        it("Returns false if user does not have a role", async () => {
            const { sampleAccount, roles } = await setRoles(["admin"]);
            await expect(roles.hasRole(sampleAccount.uid, "manager")).to.eventually.be.false;
        });
    });

    describe("getRequestedRoles", () => {
        it.skip("Fails if account doesnt exist");
        it.skip("Returns empty array if account never had roles set up");
        it.skip("Returns previously set roles");
    });

    describe("requestRoles", () => {
        it.skip("Adds specified roles to requestedRoles");
        it.skip("Does not remove previous roles when adding new ones");
    });

    describe("removeFromRequestedRoles", () => {
        it.skip("Removes only specified roles from requested roles");
    });
});
