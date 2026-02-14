export interface AffiliateProvider {
    name: string;
    slug: string;
    url: string;
    tagline: string;
    credit: string;
    color: string;
}

export const affiliateProviders: AffiliateProvider[] = [
    {
        name: 'DigitalOcean',
        slug: 'digitalocean',
        url: 'https://www.digitalocean.com/?refcode=YOUR_CODE&utm_campaign=Referral_Invite&utm_medium=Referral_Program',
        tagline: 'Simple cloud hosting',
        credit: '$200 free credit for 60 days',
        color: '#0061FF',
    },
    {
        name: 'Vultr',
        slug: 'vultr',
        url: 'https://www.vultr.com/?ref=YOUR_CODE',
        tagline: 'High performance cloud',
        credit: '$300 free credit',
        color: '#007BFC',
    },
    {
        name: 'Hetzner',
        slug: 'hetzner',
        url: 'https://hetzner.cloud/?ref=YOUR_CODE',
        tagline: 'European cloud hosting',
        credit: '€20 free credit',
        color: '#D50C2D',
    },
];

export function trackAffiliateClick(provider: string) {
    try {
        fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'affiliate_click',
                metadata: { provider },
            }),
        }).catch(() => {
            // Silent fail — analytics shouldn't break UX
        });
    } catch {
        // Silent fail
    }
}
