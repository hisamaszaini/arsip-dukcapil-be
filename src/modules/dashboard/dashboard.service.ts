import { handleFindError } from '@/common/utils/handle-prisma-error';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getDashboardDataAll() {
    try {
      const LIMIT = 5;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // 1. Fetch all categories
      const categories = await this.prisma.kategori.findMany();

      // 2. Fetch User Count (Keep this for admin)
      const userCount = await this.prisma.user.count();

      // 3. Fetch ArsipSemua Counts per Category
      const arsipCounts = await this.prisma.arsipSemua.groupBy({
        by: ['idKategori'],
        _count: {
          id: true,
        },
      });

      // 4. Build Stats Array
      const stats: { label: string; count: number; icon: string; gradient: string; slug?: string }[] = [
        { label: 'Jumlah Pengguna', count: userCount, icon: 'Users2', gradient: 'gradient-sky' },
      ];

      // Add dynamic categories to stats
      categories.forEach(cat => {
        const count = arsipCounts.find(c => c.idKategori === cat.id)?._count.id || 0;
        stats.push({
          label: cat.name,
          slug: cat.slug, // Add slug for frontend styling
          count: count,
          icon: 'FileText', // Default icon for dynamic categories
          gradient: 'gradient-indigo', // Default gradient
        });
      });

      // 5. Fetch Recent Activities (Dynamic Only)
      const lastArsipSemua = await this.prisma.arsipSemua.findMany({
        take: LIMIT,
        orderBy: { createdAt: 'desc' },
        select: { id: true, no: true, createdAt: true, kategori: { select: { name: true } } }
      });

      const recentActivities = lastArsipSemua.map((r) => ({ ...r, jenisLayanan: r.kategori.name, nama: r.no }));

      // 6. Monthly Stats
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthlyMap: Record<string, any> = {};

      for (let i = 0; i <= 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = { month: monthNames[d.getMonth()] };

        // Initialize all keys to 0
        stats.forEach(s => {
          if (s.label !== 'Jumlah Pengguna') {
            monthlyMap[key][s.label] = 0;
          }
        });
      }

      // Fetch raw monthly data for dynamic
      const arsipSemuaRecords = await this.prisma.arsipSemua.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, kategori: { select: { name: true } } }
      });

      // Add dynamic monthly data
      arsipSemuaRecords.forEach(r => {
        const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          const label = r.kategori.name;
          monthlyMap[key][label] = (monthlyMap[key][label] || 0) + 1;
        }
      });

      const monthlyStats = Object.values(monthlyMap).reverse();

      return {
        message: 'Data dashboard berhasil diambil',
        data: {
          stats,
          recentActivities,
          monthlyStats,
        },
      };

    } catch (error) {
      handleFindError(error, 'Dashboard');
    }
  }

  async getDashboardDataOperatorAll(id: number) {
    try {
      const LIMIT = 5;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // 1. Fetch all categories
      const categories = await this.prisma.kategori.findMany();

      // 2. Fetch ArsipSemua Counts per Category (Filtered by Operator)
      const arsipCounts = await this.prisma.arsipSemua.groupBy({
        by: ['idKategori'],
        where: { createdById: id },
        _count: {
          id: true,
        },
      });

      // 3. Build Stats Array
      const stats: any[] = [];

      // Add dynamic categories to stats
      categories.forEach(cat => {
        const count = arsipCounts.find(c => c.idKategori === cat.id)?._count.id || 0;
        stats.push({
          label: cat.name,
          slug: cat.slug, // Add slug for frontend styling
          count: count,
          icon: 'FileText',
          gradient: 'gradient-indigo',
        });
      });

      // 4. Fetch Recent Activities (Dynamic Only) - Filtered
      const lastArsipSemua = await this.prisma.arsipSemua.findMany({
        where: { createdById: id },
        take: LIMIT,
        orderBy: { createdAt: 'desc' },
        select: { id: true, no: true, createdAt: true, kategori: { select: { name: true } } }
      });

      const recentActivities = lastArsipSemua.map((r) => ({ ...r, jenisLayanan: r.kategori.name, nama: r.no }));

      // 5. Monthly Stats
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthlyMap: Record<string, any> = {};

      for (let i = 0; i <= 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = { month: monthNames[d.getMonth()] };

        stats.forEach(s => {
          monthlyMap[key][s.label] = 0;
        });
      }

      // Fetch raw monthly data for dynamic
      const arsipSemuaRecords = await this.prisma.arsipSemua.findMany({
        where: { createdById: id, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, kategori: { select: { name: true } } }
      });

      // Add dynamic monthly data
      arsipSemuaRecords.forEach(r => {
        const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          const label = r.kategori.name;
          monthlyMap[key][label] = (monthlyMap[key][label] || 0) + 1;
        }
      });

      const monthlyStats = Object.values(monthlyMap).reverse();

      return {
        message: 'Data dashboard operator berhasil diambil',
        data: {
          stats,
          recentActivities,
          monthlyStats,
        },
      };

    } catch (error) {
      handleFindError(error, 'Dashboard Operator');
    }
  }
}
