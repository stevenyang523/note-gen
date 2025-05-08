'use client';
import { FileUp } from "lucide-react"
import { useTranslations } from 'next-intl';
import { GithubSync } from "./github-sync";
import { SettingType } from '../components/setting-base';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebdavSync from './webdav-sync';

export default function SyncPage() {
  const t = useTranslations();
  
  return (
    <SettingType id="sync" icon={<FileUp />} title={t('settings.sync.title')} desc={t('settings.sync.desc')}>
      <Tabs defaultValue="Github">
        <TabsList className="grid grid-cols-2 w-[400px] mb-8">
          <TabsTrigger value="Github">Github</TabsTrigger>
          <TabsTrigger value="Webdav">Webdav</TabsTrigger>
        </TabsList>
        <TabsContent value="Github">
        <GithubSync />
        </TabsContent>
        <TabsContent value="Webdav">
          <WebdavSync />
        </TabsContent>
      </Tabs>
    </SettingType>
  )
}
