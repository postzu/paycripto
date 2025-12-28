import { routing, redirect } from '@/src/i18n/routing';

export default function RootRedirectPage() {
  redirect({ href: '/', locale: routing.defaultLocale, forcePrefix: true });
}
