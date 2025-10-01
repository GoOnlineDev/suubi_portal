'use client'

import { ReactNode, useEffect } from 'react'
import { ConvexReactClient, useMutation } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth, useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)

function UserInitializer() {
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      createOrGetUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl,
      }).catch(error => console.error("Failed to create or get user:", error));
    }
  }, [isSignedIn, user, createOrGetUser]);

  return null;
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserInitializer />
      {children}
    </ConvexProviderWithClerk>
  )
}