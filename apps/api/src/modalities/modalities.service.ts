import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { modalities, positions, statTypes } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class ModalitiesService {
  async getAdminList() {
    return await db.query.modalities.findMany({
      orderBy: [desc(modalities.createdAt)],
      with: {
        positions: true,
        statTypes: true,
      },
    });
  }

  async getAllActive() {
    return await db.query.modalities.findMany({
      where: eq(modalities.isActive, true),
      orderBy: [desc(modalities.createdAt)],
      with: {
        positions: true,
        statTypes: true,
      },
    });
  }

  async createModality(data: any) {
    const [result] = await db.insert(modalities).values({
      name: data.name,
      description: data.description || null,
      isTeamBased: data.isTeamBased === 'true' || data.isTeamBased === true,
      isActive: true,
    });
    const modalityId = result.insertId;

    if (data.positionsJson) {
      try {
        const parsedPositions = JSON.parse(data.positionsJson);
        if (Array.isArray(parsedPositions) && parsedPositions.length > 0) {
          await db.insert(positions).values(
            parsedPositions.map((p: any) => ({
              modalityId,
              name: p.name,
              abbreviation: p.abbreviation || null,
            }))
          );
        }
      } catch (e) {
        console.error('Failed to parse positions', e);
      }
    }

    return { success: true, id: modalityId };
  }

  async updateModality(data: any) {
    await db.update(modalities)
      .set({
        name: data.name,
        description: data.description || null,
        isTeamBased: data.isTeamBased === 'true' || data.isTeamBased === true,
      })
      .where(eq(modalities.id, data.id));
    return { success: true };
  }

  async deactivateModality(id: number) {
    await db.update(modalities).set({ isActive: false }).where(eq(modalities.id, id));
    return { success: true };
  }

  async reactivateModality(id: number) {
    await db.update(modalities).set({ isActive: true }).where(eq(modalities.id, id));
    return { success: true };
  }

  async createPosition(data: any) {
    await db.insert(positions).values({
      modalityId: data.modalityId,
      name: data.positionName,
      abbreviation: data.abbreviation || null,
    });
    return { success: true };
  }

  async deletePosition(id: number) {
    await db.delete(positions).where(eq(positions.id, id));
    return { success: true };
  }

  async createStatType(data: any) {
    await db.insert(statTypes).values({
      modalityId: data.modalityId,
      name: data.name,
      unit: data.unit || null,
      isHigherBetter: true,
    });
    return { success: true };
  }

  async deleteStatType(id: number) {
    await db.delete(statTypes).where(eq(statTypes.id, id));
    return { success: true };
  }
}
