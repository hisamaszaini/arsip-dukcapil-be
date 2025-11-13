import { handleFindError } from '@/common/utils/handle-prisma-error';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardData() {
        try {
            const LIMIT = 5;
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const [
                // Total counts
                userCount,
                kelahiranCount,
                kematianCount,
                kehilanganCount,
                pindahCount,
                perubahanCount,

                // Latest activity (5 each)
                lastKelahiran,
                lastKematian,
                lastKehilangan,
                lastPindah,
                lastPerubahan,

                // Monthly raw records
                kelahiranRecords,
                kematianRecords,
                kehilanganRecords,
                pindahRecords,
                perubahanRecords
            ] = await Promise.all([

                // Counts
                this.prisma.user.count(),
                this.prisma.aktaKelahiran.count(),
                this.prisma.aktaKematian.count(),
                this.prisma.suratKehilangan.count(),
                this.prisma.suratPermohonanPindah.count(),
                this.prisma.suratPerubahanKependudukan.count(),

                // Recent 5 records (FULL 5 SERVICES)
                this.prisma.aktaKelahiran.findMany({
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, noAkta: true, createdAt: true }
                }),
                this.prisma.aktaKematian.findMany({
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, noAkta: true, createdAt: true }
                }),
                this.prisma.suratKehilangan.findMany({
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, nik: true, createdAt: true }
                }),
                this.prisma.suratPermohonanPindah.findMany({
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, nik: true, createdAt: true }
                }),
                this.prisma.suratPerubahanKependudukan.findMany({
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, nik: true, createdAt: true }
                }),

                // MONTHLY 6 months raw records
                this.prisma.aktaKelahiran.findMany({
                    where: { createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.aktaKematian.findMany({
                    where: { createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.suratKehilangan.findMany({
                    where: { createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.suratPermohonanPindah.findMany({
                    where: { createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.suratPerubahanKependudukan.findMany({
                    where: { createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                })
            ]);

            // ===========================================
            // Stats (5 layanan)
            // ===========================================
            const stats = {
                totalUser: userCount,
                totalAktaKelahiran: kelahiranCount,
                totalAktaKematian: kematianCount,
                totalSuratKehilangan: kehilanganCount,
                totalSuratPermohonanPindah: pindahCount,
                totalSuratPerubahanKependudukan: perubahanCount,
            };

            // ===========================================
            // Recent Activities (5 layanan)
            // ===========================================
            const allActivities = [
                ...lastKelahiran.map(r => ({ ...r, jenisLayanan: "Akta Kelahiran" })),
                ...lastKematian.map(r => ({ ...r, jenisLayanan: "Akta Kematian" })),
                ...lastKehilangan.map(r => ({ ...r, jenisLayanan: "Surat Kehilangan" })),
                ...lastPindah.map(r => ({ ...r, jenisLayanan: "Surat Permohonan Pindah" })),
                ...lastPerubahan.map(r => ({ ...r, jenisLayanan: "Surat Perubahan Kependudukan" })),
            ];

            const recentActivities = allActivities
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, LIMIT);

            // ===========================================
            // Monthly Chart
            // ===========================================
            const monthNames = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];

            const monthlyMap: Record<string, any> = {};

            for (let i = 0; i <= 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);

                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

                monthlyMap[key] = {
                    month: monthNames[d.getMonth()],
                    aktaKelahiran: 0,
                    aktaKematian: 0,
                    suratKehilangan: 0,
                    suratPermohonanPindah: 0,
                    suratPerubahanKependudukan: 0,
                };
            }

            const addMonthly = (records, field) => {
                records.forEach(r => {
                    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
                    if (monthlyMap[key]) monthlyMap[key][field]++;
                });
            };

            addMonthly(kelahiranRecords, "aktaKelahiran");
            addMonthly(kematianRecords, "aktaKematian");
            addMonthly(kehilanganRecords, "suratKehilangan");
            addMonthly(pindahRecords, "suratPermohonanPindah");
            addMonthly(perubahanRecords, "suratPerubahanKependudukan");

            const monthlyStats = Object.values(monthlyMap).reverse();

            // ===========================================
            return {
                message: "Data dashboard berhasil diambil",
                data: {
                    stats,
                    recentActivities,
                    monthlyStats,
                }
            };

        } catch (error) {
            handleFindError(error, "Dashboard");
        }
    }

    async getDashboardDataOperator(id: number) {
        try {
            const LIMIT = 5;
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const [
                // Counts (5 layanan)
                countKelahiran,
                countKematian,
                countKehilangan,
                countPindah,
                countPerubahan,

                // Recent (5 layanan)
                lastKelahiran,
                lastKematian,
                lastKehilangan,
                lastPindah,
                lastPerubahan,

                // Monthly raw records (5 layanan)
                kelahiranRecords,
                kematianRecords,
                kehilanganRecords,
                pindahRecords,
                perubahanRecords
            ] = await Promise.all([
                this.prisma.aktaKelahiran.count({ where: { createdById: id } }),
                this.prisma.aktaKematian.count({ where: { createdById: id } }),
                this.prisma.suratKehilangan.count({ where: { createdById: id } }),
                this.prisma.suratPermohonanPindah.count({ where: { createdById: id } }),
                this.prisma.suratPerubahanKependudukan.count({ where: { createdById: id } }),

                this.prisma.aktaKelahiran.findMany({
                    where: { createdById: id },
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, noAkta: true, createdAt: true }
                }),
                this.prisma.aktaKematian.findMany({
                    where: { createdById: id },
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, noAkta: true, createdAt: true }
                }),
                this.prisma.suratKehilangan.findMany({
                    where: { createdById: id },
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, nik: true, createdAt: true }
                }),
                this.prisma.suratPermohonanPindah.findMany({
                    where: { createdById: id },
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, nik: true, createdAt: true }
                }),
                this.prisma.suratPerubahanKependudukan.findMany({
                    where: { createdById: id },
                    take: LIMIT,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, nik: true, createdAt: true }
                }),

                this.prisma.aktaKelahiran.findMany({
                    where: { createdById: id, createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.aktaKematian.findMany({
                    where: { createdById: id, createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.suratKehilangan.findMany({
                    where: { createdById: id, createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.suratPermohonanPindah.findMany({
                    where: { createdById: id, createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                }),
                this.prisma.suratPerubahanKependudukan.findMany({
                    where: { createdById: id, createdAt: { gte: sixMonthsAgo } },
                    select: { createdAt: true }
                })
            ]);

            // ============================
            // Stats
            // ============================
            const stats = {
                totalUser: 0, // Operator tidak butuh user count
                totalAktaKelahiran: countKelahiran,
                totalAktaKematian: countKematian,
                totalSuratKehilangan: countKehilangan,
                totalSuratPermohonanPindah: countPindah,
                totalSuratPerubahanKependudukan: countPerubahan
            };

            // ============================
            // Recent Activities (5 layanan)
            // ============================
            const allActivities = [
                ...lastKelahiran.map(r => ({ ...r, jenisLayanan: "Akta Kelahiran" })),
                ...lastKematian.map(r => ({ ...r, jenisLayanan: "Akta Kematian" })),
                ...lastKehilangan.map(r => ({ ...r, jenisLayanan: "Surat Kehilangan" })),
                ...lastPindah.map(r => ({ ...r, jenisLayanan: "Surat Permohonan Pindah" })),
                ...lastPerubahan.map(r => ({ ...r, jenisLayanan: "Perubahan Kependudukan" }))
            ];

            const recentActivities = allActivities
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, LIMIT);

            // ============================
            // Monthly Chart
            // ============================
            const monthNames = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];

            const monthlyMap: Record<string, any> = {};

            for (let i = 0; i <= 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);

                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

                monthlyMap[key] = {
                    month: monthNames[d.getMonth()],
                    aktaKelahiran: 0,
                    aktaKematian: 0,
                    suratKehilangan: 0,
                    suratPermohonanPindah: 0,
                    suratPerubahanKependudukan: 0
                };
            }

            const addMonthly = (records, field) => {
                records.forEach(r => {
                    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
                    if (monthlyMap[key]) monthlyMap[key][field]++;
                });
            };

            addMonthly(kelahiranRecords, "aktaKelahiran");
            addMonthly(kematianRecords, "aktaKematian");
            addMonthly(kehilanganRecords, "suratKehilangan");
            addMonthly(pindahRecords, "suratPermohonanPindah");
            addMonthly(perubahanRecords, "suratPerubahanKependudukan");

            const monthlyStats = Object.values(monthlyMap).reverse();

            return {
                message: "Data dashboard operator berhasil diambil",
                data: {
                    stats,
                    recentActivities,
                    monthlyStats
                }
            };

        } catch (error) {
            handleFindError(error, "Dashboard Operator");
        }
    }
}
