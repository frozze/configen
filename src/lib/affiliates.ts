export interface AffiliateProvider {
    name: string;
    slug: string;
    url: string;
    tagline: string;
    credit: string;
    color: string;
    image?: string; // Fallback or single image
    imageLight?: string; // Specific image for light mode
    imageDark?: string; // Specific image for dark mode
}

export const affiliateProviders: AffiliateProvider[] = [
    {
        name: 'DigitalOcean',
        slug: 'digitalocean',
        url: 'https://www.digitalocean.com/?refcode=fe1b9bfc479d&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge',
        image: 'https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg',
        tagline: 'Simple cloud hosting',
        credit: '$200 free credit',
        color: '#0061FF',
    },
    {
        name: 'Vultr',
        slug: 'vultr',
        url: 'https://www.vultr.com/?ref=9868399',
        imageLight: '/images/vultr-logo-light.svg',
        imageDark: '/images/vultr-logo-dark.svg',
        tagline: 'High performance cloud',
        credit: '$300 free credit',
        color: '#007BFC',
    },
    // {
    //     name: 'Hetzner',
    //     slug: 'hetzner',
    //     url: 'https://hetzner.cloud/?ref=YOUR_CODE',
    //     tagline: 'European cloud hosting',
    //     credit: '€20 free credit',
    //     color: '#D50C2D',
    // },
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
