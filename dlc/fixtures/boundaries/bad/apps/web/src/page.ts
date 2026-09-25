import { privateAdminValue } from "../../admin/src/private";
import { aliasAdminValue } from "@admin/private";
import { hidden } from "@fixture/auth/private";
import { secret } from "@fixture/auth/src/secret";
import { formatRelativeBypass } from "../../../packages/format/src/index";

export async function load() {
  const response = await fetch(process.env.ADMIN_BASE_URL!);
  return [privateAdminValue, aliasAdminValue, hidden, secret, formatRelativeBypass, response.status];
}
