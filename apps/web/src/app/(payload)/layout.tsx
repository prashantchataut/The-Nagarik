/* Payload admin root layout - keep lean; regenerate importMap via `payload generate:importmap` when needed. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import { importMap } from './importMap'
import '@payloadcms/next/css'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = (args) =>
  handleServerFunctions({
    config,
    importMap,
    name: args.name,
    args: args.args,
  })

const Layout = ({ children }: Args) => RootLayout({ config, importMap, children, serverFunction })

export const metadata: Metadata = {
  title: 'The Nagarik CMS',
  description: 'Editorial CMS for The Nagarik (द नागरिक)',
}

export default Layout
