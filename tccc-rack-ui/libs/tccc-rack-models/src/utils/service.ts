/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { createClient, type PathsByMethod } from "@kosdev-code/kos-ui-sdk";
import { paths } from "./openapi";

const api = createClient<paths>();

export type KosApi = paths;
export type ApiPath = keyof paths;
export type ValidPaths = PathsByMethod<paths>;

export type GetPaths = ValidPaths["get"];
export type PostPaths = ValidPaths["post"];
export type PutPaths = ValidPaths["put"];
export type DeletePaths = ValidPaths["delete"];

export default api;