import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { organizations } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class OrganizationsService {
  async findOne(id: number) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
    return org;
  }

  async createOrganization(userId: number, data: any) {
    const [result] = await db.insert(organizations).values({
      name: data.name,
      tag: data.tag,
      description: data.description,
      logoUrl: data.logoUrl,
      presidentId: userId,
      status: 'active',
    });
    return { success: true, id: result.insertId };
  }

  async getDetails(id: number) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
      with: {
        president: true,
        competitions: {
          with: {
            modality: true,
          }
        }
      }
    });

    if (!org) throw new NotFoundException();

    let safePresident = null;
    if (org.president) {
      const { passwordHash, ...rest } = org.president;
      safePresident = rest;
    }

    return { ...org, president: safePresident };
  }

  async updateOrganization(id: number, data: any) {
    await db.update(organizations).set({
      name: data.name,
      tag: data.tag,
      description: data.description,
      logoUrl: data.logoUrl,
    }).where(eq(organizations.id, id));
    return { success: true };
  }

  async toggleStatus(id: number) {
    const org = await this.findOne(id);
    if (!org) return { success: false };
    
    await db.update(organizations).set({
      status: org.status === 'active' ? 'inactive' : 'active'
    }).where(eq(organizations.id, id));
    return { success: true };
  }

  async deleteOrganization(id: number) {
    await db.delete(organizations).where(eq(organizations.id, id));
    return { success: true };
  }
}
