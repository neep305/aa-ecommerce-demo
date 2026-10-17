import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  EVENT_GUIDE_SNIPPETS,
  LAUNCH_EXTENSION_SETUP,
  type ImplementationApproach,
} from '@/analytics/guide-snippets'

function CodeBlock({ label, code }: { label?: string; code: string }) {
  return (
    <div className="p-2 bg-stone-900 text-stone-100 rounded font-mono text-[10px] leading-relaxed">
      {label && <p className="text-stone-400 mb-1">{label}</p>}
      <pre className="whitespace-pre-wrap break-words">{code}</pre>
    </div>
  )
}

function LaunchSetupSection() {
  return (
    <div className="mt-4 pt-3 border-t border-stone-200 space-y-2">
      <p className="text-xs font-medium text-stone-700">Launch Extension 설정</p>
      <div className="text-[10px] text-stone-600 space-y-1">
        <p className="font-medium">필수 Extension:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {LAUNCH_EXTENSION_SETUP.extensions.map((ext) => (
            <li key={ext.name}>
              <span className="font-medium">{ext.name}</span> — {ext.role}
            </li>
          ))}
        </ul>
      </div>
      <CodeBlock label="// Embed Code (index.html)" code={LAUNCH_EXTENSION_SETUP.embedCode} />
      <CodeBlock label="// ECID 조회 (ecid.ts)" code={LAUNCH_EXTENSION_SETUP.ecidExample} />
      <CodeBlock label="// Target Offer (target.ts)" code={LAUNCH_EXTENSION_SETUP.targetExample} />
    </div>
  )
}

function EventSnippetContent({
  approach,
  snippet,
}: {
  approach: ImplementationApproach
  snippet: (typeof EVENT_GUIDE_SNIPPETS)[number]
}) {
  if (approach === 'appMeasurement') {
    return (
      <CodeBlock
        label={`// ${snippet.appMeasurement.title}`}
        code={snippet.appMeasurement.code}
      />
    )
  }

  if (approach === 'launchExtension') {
    return (
      <div className="space-y-2">
        <CodeBlock label="// Client — adobeDataLayer.push" code={snippet.launchExtension.clientCode} />
        <CodeBlock label="// Launch Rule" code={snippet.launchExtension.launchRule} />
        {snippet.launchExtension.dataElements && (
          <CodeBlock label="// Data Elements" code={snippet.launchExtension.dataElements} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <CodeBlock label="// alloy('sendEvent')" code={snippet.webSdk.code} />
      {snippet.webSdk.note && (
        <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded">
          {snippet.webSdk.note}
        </p>
      )}
    </div>
  )
}

export function ImplementationGuidePanel() {
  const [approach, setApproach] = useState<ImplementationApproach>('launchExtension')
  const [openEvent, setOpenEvent] = useState<string>('')

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <Tabs
        value={approach}
        onValueChange={(v) => setApproach(v as ImplementationApproach)}
        className="w-full"
      >
        <TabsList className="w-full h-auto flex-wrap gap-0.5">
          <TabsTrigger value="appMeasurement" className="flex-1 text-[10px] px-1">
            AA
          </TabsTrigger>
          <TabsTrigger value="launchExtension" className="flex-1 text-[10px] px-1">
            Launch
          </TabsTrigger>
          <TabsTrigger value="webSdk" className="flex-1 text-[10px] px-1">
            Web SDK
          </TabsTrigger>
        </TabsList>

        <Accordion
          type="single"
          collapsible
          className="w-full mt-2"
          value={openEvent}
          onValueChange={setOpenEvent}
        >
          {EVENT_GUIDE_SNIPPETS.map((snippet) => (
            <AccordionItem key={snippet.event} value={snippet.event}>
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                {snippet.label}
                <span className="text-stone-400 font-normal ml-1">({snippet.event})</span>
              </AccordionTrigger>
              <AccordionContent>
                <EventSnippetContent approach={approach} snippet={snippet} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {approach === 'launchExtension' && <LaunchSetupSection />}

        {approach === 'webSdk' && (
          <div className="mt-4 pt-3 border-t border-stone-200">
            <p className="text-[10px] text-stone-600">
              Web SDK는 AEP Datastream + Edge Configuration이 필요합니다.
              자세한 설정은 <code className="bg-stone-100 px-1 rounded">docs/implementation-web-sdk.md</code>를 참고하세요.
            </p>
          </div>
        )}
      </Tabs>
    </ScrollArea>
  )
}
