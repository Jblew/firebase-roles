// tslint:disable no-shadowed-variable
import * as _ from "lodash";
import ow from "ow";

import { ow_catch } from "./util";

export interface Configuration {
    accountsCollection: string;
    roles: { [k: string]: Configuration.Role };
}

export namespace Configuration {
    export function validate(c: Configuration) {
        ow(c.accountsCollection, "Configuration.accountsCollection", ow.string.nonEmpty);

        const roleNames = _.keys(c);
        ow(
            c.roles,
            "Configuration.roles",
            ow.object.valuesOfType(
                ow.object.is(o => ow_catch(() => Configuration.Role.validate(o as Role, roleNames))),
            ),
        );
    }

    export function isAllowedRole(config: Configuration, role: string) {
        return typeof config.roles[role] !== undefined;
    }

    export interface Role {
        manages: string[];
    }

    export namespace Role {
        export function validate(r: Role, roleNames: string[]) {
            ow(r.manages, "Role.manages", ow.array.ofType(ow.string.nonEmpty.oneOf(roleNames)));
        }
    }
}