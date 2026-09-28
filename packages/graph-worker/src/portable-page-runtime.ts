export interface PortablePage {
  readonly uuid: string;
  readonly content: string;
}

export interface PortablePagePort {
  pages(): Promise<readonly PortablePage[]>;
  createPage(title: string): Promise<PortablePage>;
}

/** Platform-neutral semantic resolution for page creation. Storage stays behind the port. */
export async function executePageCreate(title: string, port: PortablePagePort): Promise<{ readonly focus: string; readonly created: boolean }> {
  const existing = (await port.pages()).find(page => page.content.localeCompare(title, undefined, { sensitivity: "accent" }) === 0);
  if (existing) return Object.freeze({ focus: existing.uuid, created: false });
  const page = await port.createPage(title);
  return Object.freeze({ focus: page.uuid, created: true });
}
