import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { createPropertyService } from "../../../packages/properties/src/index.js";

interface World { service?: ReturnType<typeof createPropertyService>; properties?: Map<string, string>; error?: unknown; before?: readonly string[]; effective?: readonly string[]; }
function service(world: World) { if (!world.service) { let id = 450; world.service = createPropertyService({ uuid: { next: () => `00000000-0000-4000-8000-${(++id).toString().padStart(12, "0")}` } }); world.properties = new Map(); } return world.service; }
Given("property {string} has type {string} and cardinality {string}", async function (this: World, name: string, type: "number" | "date", cardinality: "one" | "many") { const property = await service(this).create({ name, type, cardinality }); this.properties!.set(name, property.uuid); });
Given("block {string} exists", function (this: World, _name: string) { service(this); });
When("I try to set property {string} of block {string} to text {string}", async function (this: World, property: string, block: string, value: string) { try { await service(this).set(block, this.properties!.get(property)! as never, { type: "text", value }); } catch (error) { this.error = error; } });
Given("class {string} defines property {string}", async function (this: World, name: string, propertyName: string) { const property = await service(this).create({ name: propertyName, type: "date", cardinality: "one" }); this.properties!.set(propertyName, property.uuid); await service(this).defineClass(name, [property.uuid]); });
Given("block {string} has class {string}", async function (this: World, block: string, name: string) { await service(this).assignClass(block, name); });
When("I request effective properties of {string}", async function (this: World, block: string) { this.effective = (await service(this).effectiveDefinitions(block)).map(value => value.name); });
Then("property {string} is present", function (this: World, name: string) { assert.ok(this.effective?.includes(name)); });
Given("class {string} extends class {string}", async function (this: World, child: string, parent: string) { try { await service(this).defineClass(child); } catch {} try { await service(this).defineClass(parent); } catch {} await service(this).extendClass(child, parent); });
When("I try to make class {string} extend class {string}", async function (this: World, child: string, parent: string) { this.before = await service(this).parentsOf(child); try { await service(this).extendClass(child, parent); } catch (error) { this.error = error; } });
Then("the operation fails", function (this: World) { assert.ok(this.error); });
Then("the class graph is unchanged", async function (this: World) { assert.deepEqual(await service(this).parentsOf("C"), this.before); });
