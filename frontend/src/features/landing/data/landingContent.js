import {
  ArrowRight,
  Eye,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

export const navigationLinks = [
  { label: 'Why Keynest', href: '#why-keynest' },
  { label: 'Features', href: '#features' },
]

export const brandContent = {
  name: 'Keynest',
  login: 'Log in',
  getStarted: 'Get started',
  homeLabel: 'Keynest home',
  openMenuLabel: 'Open navigation menu',
  closeMenuLabel: 'Close navigation menu',
}

export const heroContent = {
  title: 'Your logins,',
  titleEmphasis: 'right where you need them.',
  description:
    'Save your website accounts and sign-in details in one encrypted vault. Find an entry quickly, then reveal its password when you are ready to sign in.',
  primaryAction: 'Create your account',
  secondaryAction: 'Explore the vault',
  reassurance: 'Made for the logins you use every day.',
  previewTitle: 'All logins',
  previewDescription: 'Your personal vault',
  previewSearch: 'Search your vault',
  previewCount: '3 saved logins',
  previewAdd: 'New login',
  previewEntries: [
    { mark: 'G', name: 'GitHub', detail: 'you@example.com', category: 'Development' },
    { mark: 'M', name: 'Mail', detail: 'hello@example.com', category: 'Email' },
    { mark: 'D', name: 'Drive', detail: 'you@example.com', category: 'Work' },
  ],
  previewFooter: 'Passwords are hidden until you reveal them.',
  mobilePreviewGreeting: 'Your accounts, at a glance',
  mobilePreviewTitle: 'Quick access',
  mobilePreviewCount: 'Recently used',
  mobilePreviewFooter: 'Your passwords are encrypted and hidden.',
  privacyTitle: 'Your passwords stay out of sight',
  privacyDescription: 'Reveal only the login you came for.',
  floatingTitle: 'Right where you left it',
  floatingDescription: 'Find a login. Carry on.',
}

export const benefitsContent = {
  eyebrow: 'Why Keynest',
  title: 'Your logins,',
  titleEmphasis: 'easy to find and manage.',
  description:
    'Instead of checking notes, messages, or browser tabs, open your vault and find the sign-in details you saved.',
  items: [
    {
      icon: KeyRound,
      title: 'Find everything in one place',
      description:
        'Save the website, username, and password together. Next time, you know exactly where to look.',
    },
    {
      icon: Eye,
      title: 'See passwords only when needed',
      description:
        'Your vault list shows the account details, not the saved password. Reveal one only when you need it.',
    },
    {
      icon: ShieldCheck,
      title: 'Keep control of your account',
      description:
        'Change your sign-in password, get a new recovery code, or delete your account and saved vault data.',
    },
  ],
}

export const featuresContent = {
  eyebrow: 'What you can do',
  title: 'Your everyday sign-ins, made simpler.',
  description:
    'Keynest gives you a straightforward way to save, find, and update the logins you use.',
  items: [
    {
      icon: Plus,
      title: 'Save your account details',
      description:
        'Add a website, email or username, and password as one easy-to-find entry.',
    },
    {
      icon: Eye,
      title: 'Reveal a password when needed',
      description:
        'Choose an entry to reveal its password. The rest of your saved passwords remain hidden.',
    },
    {
      icon: LockKeyhole,
      title: 'Update your sign-in details',
      description:
        'Change your account password while signed in. Your recovery code is replaced with a new one to save.',
    },
    {
      icon: Trash2,
      title: 'Edit or remove an entry',
      description:
        'Keep your vault up to date by changing an entry or removing one you no longer use.',
    },
  ],
}

export const callToActionContent = {
  eyebrow: 'Ready to get organized?',
  title: 'Save your first login in Keynest.',
  description:
    'Create an account, then add the sign-in details you want to keep close.',
  action: 'Create your account',
  icon: ArrowRight,
}

export const footerContent = {
  tagline: 'Your saved sign-ins, together in one place.',
  login: 'Log in',
  register: 'Create account',
}

export const scrollToTopContent = {
  label: 'Scroll to top',
}
