# Namecheap & Cloudflare Setup Guide

Here is the step-by-step process to buy your domain on Namecheap and set up Cloudflare to manage your DNS and provide security/CDN for your project.

## Step 1: Purchase Your Domain on Namecheap
1. Go to [Namecheap.com](https://www.namecheap.com/) and search for your desired domain name.
2. Add the domain to your cart and proceed to checkout.
3. (Optional but recommended) Leave **Domain Privacy** enabled (it's free on Namecheap) so your personal info isn't public.
4. Complete the purchase.

## Step 2: Add Your Domain to Cloudflare
1. Go to [Cloudflare.com](https://dash.cloudflare.com/sign-up) and sign up or log in.
2. On your Cloudflare dashboard, click **Add a Site** (or "Add a domain").
3. Enter the exact domain name you just bought (e.g., `yourdomain.com`) and click **Continue**.
4. Scroll down and select the **Free** plan, then click **Continue**.
5. Cloudflare will quickly scan your domain for existing DNS records. Since it's a brand new domain, it might just find a few default Namecheap records. Review them and click **Continue**.

## Step 3: Get Your Cloudflare Nameservers
Cloudflare will now give you two nameservers. They will look something like this:
- `olga.ns.cloudflare.com`
- `phil.ns.cloudflare.com`

**Keep this Cloudflare tab open**, as you will need to copy these nameservers in the next step.

## Step 4: Point Namecheap to Cloudflare
Now, we need to tell Namecheap to let Cloudflare handle the traffic.

1. Go back to your [Namecheap Dashboard](https://ap.www.namecheap.com/).
2. Find your new domain in the **Domain List** and click the **Manage** button next to it.
3. Scroll down to the **Nameservers** section.
4. Click the dropdown menu that currently says *Namecheap BasicDNS* and change it to **Custom DNS**.
5. Paste the two Cloudflare nameservers from Step 3 into the two lines provided.
6. **Crucial:** Click the small **green checkmark** on the right side to save the changes.

> [!NOTE]
> It can take anywhere from a few minutes to 24 hours for the nameserver changes to propagate across the internet, though it usually happens within 15-30 minutes.

## Step 5: Finalize in Cloudflare
1. Go back to your open Cloudflare tab and click the button that says **Done, check nameservers**.
2. Cloudflare will guide you through a quick security/optimization setup:
   - **Automatic HTTPS Rewrites:** ON
   - **Always Use HTTPS:** ON
   - **Brotli Compression:** ON
3. Save your settings.
4. You will land on the Cloudflare dashboard for your domain. If it says "Pending Nameserver Update", just wait a bit and periodically click the "Check nameservers" button. Once it turns green and says "Active", you are fully set up!

## Step 6: Configure DNS for This Project
Once Cloudflare is active, you can point your domain to where your project is hosted (e.g., Vercel, Netlify, an AWS server, VPS, etc.). 

**Next Steps:** Let me know where we are hosting this project (or if we still need to set up hosting), and I will give you the exact DNS records to add in Cloudflare!
