import { describe, it, expect } from "vitest";
import { computeShopOnboardingAndHealth } from "./admin.service.js";

describe("Shop Approval, Verification & Health Matrix", () => {
    it("should compute accurate health score and checklist for a brand new pending shop", () => {
        const dummyPendingShop = {
            id: "shop_test_1",
            slug: "test-fresh-store",
            status: "PENDING",
            profile: {
                name: "Test Fresh Store",
                email: "fresh@test.com",
                phone: "+1234567890",
            },
            legalInfo: null,
            wallet: null,
            riskFlags: [],
        };

        const result = computeShopOnboardingAndHealth(dummyPendingShop);

        expect(result.checklist).toHaveLength(8);
        expect(result.completedSteps).toBe(1); // Only profile completed
        expect(result.progressPercent).toBe(13); // 1 / 8 = 12.5% -> 13%
        expect(result.healthScore.score).toBe(50); // 40 base + 10 profile
        expect(result.healthScore.tier).toBe("FAIR");
    });

    it("should award points and mark checklist items complete when verification is cleared", () => {
        const dummyVerifiedShop = {
            id: "shop_test_2",
            slug: "top-tier-store",
            status: "ACTIVE",
            profile: {
                name: "Top Tier Store",
                email: "owner@toptier.com",
                phone: "+1234567890",
                address: "123 Market St",
                city: "New York",
                country: "USA",
            },
            legalInfo: {
                legalBusinessName: "Top Tier LLC",
                taxId: "12-3456789",
                entityType: "LLC",
                businessVerificationStatus: "VERIFIED",
                taxIdStatus: "VERIFIED",
                addressVerificationStatus: "VERIFIED",
                ownerKycStatus: "VERIFIED",
                documents: [
                    { id: "doc_1", status: "VERIFIED", type: "CERTIFICATE_OF_INCORPORATION" },
                    { id: "doc_2", status: "VERIFIED", type: "PROOF_OF_ADDRESS" },
                ],
            },
            wallet: {
                stripeAccountId: "acct_test123",
                payoutsEnabled: true,
            },
            riskFlags: [],
        };

        const result = computeShopOnboardingAndHealth(dummyVerifiedShop);

        expect(result.completedSteps).toBe(8); // All 8 items complete
        expect(result.progressPercent).toBe(100);
        expect(result.healthScore.score).toBe(100); // 40 + 10 + 10 + 10 + 10 + 10 + 10 + 5 + 5 = 100
        expect(result.healthScore.tier).toBe("EXCELLENT");
        expect(result.healthScore.tierLabel).toBe("Optimal Standing");
    });

    it("should deduct health score properly when high-risk flags exist", () => {
        const dummyRiskShop = {
            id: "shop_test_3",
            slug: "risky-merchant",
            status: "SUSPENDED",
            profile: {
                name: "Risky Merchant",
                email: "risky@test.com",
            },
            legalInfo: {
                legalBusinessName: "Risky Inc",
                taxId: "99-9999999",
                taxIdStatus: "REJECTED",
                addressVerificationStatus: "REJECTED",
                ownerKycStatus: "REJECTED",
                documents: [],
            },
            wallet: null,
            riskFlags: [
                { id: "flag_1", flag: "SUSPICIOUS_HIGH_CHARGEBACKS", severity: "CRITICAL", resolved: false },
                { id: "flag_2", flag: "MISMATCHED_TAX_ID", severity: "HIGH", resolved: false },
                { id: "flag_3", flag: "OLD_FLAG", severity: "LOW", resolved: true }, // resolved flag should NOT deduct
            ],
        };

        const result = computeShopOnboardingAndHealth(dummyRiskShop);

        expect(result.healthScore.openFlagsCount).toBe(2);
        // Base 40 + profile 10 + legal 10 = 60
        // Deduct CRITICAL (-30) = 30
        // Deduct HIGH (-15) = 15
        // Deduct SUSPENDED (-25) = -10 -> clamped to 5
        expect(result.healthScore.score).toBe(5);
        expect(result.healthScore.tier).toBe("POOR");
        expect(result.healthScore.tierLabel).toBe("High Risk / Critical");
    });
});
