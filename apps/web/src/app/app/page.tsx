import type { Metadata } from 'next';
import { InstallGuide } from './install-guide';

export const metadata: Metadata = {
  title: 'Get the app',
  description:
    'Add Around the Bean to your home screen: your usuals in one tap and a ping when your coffee is ready.',
};

export default function AppPage() {
  return <InstallGuide />;
}
