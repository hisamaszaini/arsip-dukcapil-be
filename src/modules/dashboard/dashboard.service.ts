/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardData() {
        try {
            const activityLimit = 5;
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const [
                countUser,
                countAktaKelahiran,
                countAktaKematian,
                countSuratKehilangan,

                latestAktaKelahiran,
                latestAktaKematian,
                latestSuratKehilangan,

                kelahiranRecords,
                kematianRecords,
                kehilanganRecords,

            ] = await Promise.all([
                // Counts
                this.prisma.user.count(),
                this.prisma.aktaKelahiran.count(),
                this.prisma.aktaKematian.count(),
                this.prisma.suratKehilangan.count(),

                // Aktivitas terbaru
                this.prisma.aktaKelahiran.findMany({ take: activityLimit, orderBy: { createdAt: 'desc' }, select: { id: true, nama: true, createdAt: true } }),
                this.prisma.aktaKematian.findMany({ take: activityLimit, orderBy: { createdAt: 'desc' }, select: { id: true, nama: true, createdAt: true } }),
                this.prisma.suratKehilangan.findMany({ take: activityLimit, orderBy: { createdAt: 'desc' }, select: { id: true, nama: true, createdAt: true } }),

                // Data untuk grafik
                this.prisma.aktaKelahiran.groupBy({
                    by: ['createdAt'],
                    _count: { id: true },
                    where: { createdAt: { gte: sixMonthsAgo } },
                }),
                this.prisma.aktaKematian.groupBy({
                    by: ['createdAt'],
                    _count: { id: true },
                    where: { createdAt: { gte: sixMonthsAgo } },
                }),
                this.prisma.suratKehilangan.groupBy({
                    by: ['createdAt'],
                    _count: { id: true },
                    where: { createdAt: { gte: sixMonthsAgo } },
                })
            ]);

            const stats = {
                totalUser: countUser,
                totalAktaKelahiran: countAktaKelahiran,
                totalAktaKematian: countAktaKematian,
                totalSuratKehilangan: countSuratKehilangan,
            };

            const allActivities = [
                ...latestAktaKelahiran.map(item => ({ ...item, jenisLayanan: 'Akta Kelahiran' })),
                ...latestAktaKematian.map(item => ({ ...item, jenisLayanan: 'Akta Kematian' })),
                ...latestSuratKehilangan.map(item => ({ ...item, jenisLayanan: 'Surat Kehilangan' })),
            ];

            const recentActivities = allActivities
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, activityLimit);

            const monthlyCounts: { [key: string]: { month: string; aktaKelahiran: number; aktaKematian: number; suratKehilangan: number } } = {};
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

            for (let i = 0; i <= 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyCounts[monthKey]) {
                    monthlyCounts[monthKey] = {
                        month: monthNames[d.getMonth()],
                        aktaKelahiran: 0,
                        aktaKematian: 0,
                        suratKehilangan: 0,
                    };
                }
            }

            kelahiranRecords.forEach(rec => {
                const monthKey = `${rec.createdAt.getFullYear()}-${String(rec.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey]) monthlyCounts[monthKey].aktaKelahiran++;
            });
            kematianRecords.forEach(rec => {
                const monthKey = `${rec.createdAt.getFullYear()}-${String(rec.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey]) monthlyCounts[monthKey].aktaKematian++;
            });
            kehilanganRecords.forEach(rec => {
                const monthKey = `${rec.createdAt.getFullYear()}-${String(rec.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey]) monthlyCounts[monthKey].suratKehilangan++;
            });

            const monthlyStats = Object.values(monthlyCounts).reverse();

            return {
                message: 'Data dashboard berhasil diambil',
                data: {
                    stats,
                    recentActivities,
                    monthlyStats,
                },
            };
        } catch (error) {
            console.error('Gagal mengambil data dashboard:', error);
            throw new InternalServerErrorException('Gagal mengambil data dashboard');
        }
    }

    async getDashboardDataOperator(id: number) {
        try {
            const activityLimit = 5;
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const [
                countAktaKelahiran,
                countAktaKematian,
                countSuratKehilangan,

                latestAktaKelahiran,
                latestAktaKematian,
                latestSuratKehilangan,

                kelahiranRecords,
                kematianRecords,
                kehilanganRecords,

            ] = await Promise.all([
                // Counts
                this.prisma.aktaKelahiran.count({ where: { createdById: id } }),
                this.prisma.aktaKematian.count({ where: { createdById: id } }),
                this.prisma.suratKehilangan.count({ where: { createdById: id } }),

                // Aktivitas terbaru
                this.prisma.aktaKelahiran.findMany({ where: { createdById: id }, take: activityLimit, orderBy: { createdAt: 'desc' }, select: { id: true, nama: true, createdAt: true } }),
                this.prisma.aktaKematian.findMany({ where: { createdById: id }, take: activityLimit, orderBy: { createdAt: 'desc' }, select: { id: true, nama: true, createdAt: true } }),
                this.prisma.suratKehilangan.findMany({ where: { createdById: id }, take: activityLimit, orderBy: { createdAt: 'desc' }, select: { id: true, nama: true, createdAt: true } }),

                // Data untuk grafik
                this.prisma.aktaKelahiran.groupBy({
                    by: ['createdAt'],
                    _count: { id: true },
                    where: { createdAt: { gte: sixMonthsAgo }, createdById: id },
                }),
                this.prisma.aktaKematian.groupBy({
                    by: ['createdAt'],
                    _count: { id: true },
                    where: { createdAt: { gte: sixMonthsAgo }, createdById: id },
                }),
                this.prisma.suratKehilangan.groupBy({
                    by: ['createdAt'],
                    _count: { id: true },
                    where: { createdAt: { gte: sixMonthsAgo }, createdById: id },
                })
            ]);

            const stats = {
                totalAktaKelahiran: countAktaKelahiran,
                totalAktaKematian: countAktaKematian,
                totalSuratKehilangan: countSuratKehilangan,
            };

            const allActivities = [
                ...latestAktaKelahiran.map(item => ({ ...item, jenisLayanan: 'Akta Kelahiran' })),
                ...latestAktaKematian.map(item => ({ ...item, jenisLayanan: 'Akta Kematian' })),
                ...latestSuratKehilangan.map(item => ({ ...item, jenisLayanan: 'Surat Kehilangan' })),
            ];

            const recentActivities = allActivities
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, activityLimit);

            const monthlyCounts: { [key: string]: { month: string; aktaKelahiran: number; aktaKematian: number; suratKehilangan: number } } = {};
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

            for (let i = 0; i <= 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyCounts[monthKey]) {
                    monthlyCounts[monthKey] = {
                        month: monthNames[d.getMonth()],
                        aktaKelahiran: 0,
                        aktaKematian: 0,
                        suratKehilangan: 0,
                    };
                }
            }

            kelahiranRecords.forEach(rec => {
                const monthKey = `${rec.createdAt.getFullYear()}-${String(rec.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey]) monthlyCounts[monthKey].aktaKelahiran++;
            });
            kematianRecords.forEach(rec => {
                const monthKey = `${rec.createdAt.getFullYear()}-${String(rec.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey]) monthlyCounts[monthKey].aktaKematian++;
            });
            kehilanganRecords.forEach(rec => {
                const monthKey = `${rec.createdAt.getFullYear()}-${String(rec.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey]) monthlyCounts[monthKey].suratKehilangan++;
            });

            const monthlyStats = Object.values(monthlyCounts).reverse();

            return {
                message: 'Data dashboard berhasil diambil',
                data: {
                    stats,
                    recentActivities,
                    monthlyStats,
                },
            };
        } catch (error) {
            console.error('Gagal mengambil data dashboard:', error);
            throw new InternalServerErrorException('Gagal mengambil data dashboard');
        }

    }
}
