import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormItem, SettingRow } from "../components/setting-base";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download } from "lucide-react";
import useWebDAVStore, { WebDAVConnectionState } from "@/stores/webdav";

export default function WebdavSync() {
  const { 
    url, setUrl,
    username, setUsername,
    password, setPassword,
    path, setPath,
    connectionState, 
    backupToWebDAV,
    syncFromWebDAV,
    initWebDAVData
  } = useWebDAVStore();

  useEffect(() => {
    initWebDAVData();
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
  };

  return (
    <>
      <SettingRow>
        <FormItem title="">
          <div className="flex items-center space-x-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-4">
                  <span className="text-base font-bold">WebDAV</span>
                  <Badge 
                    className={`${
                      connectionState === WebDAVConnectionState.success 
                        ? 'bg-green-800' 
                        : connectionState === WebDAVConnectionState.checking 
                          ? 'bg-yellow-800' 
                          : 'bg-red-800'
                    }`}
                  >
                    {connectionState}
                  </Badge>
                </CardTitle>
                <CardDescription>WebDav 仅作为备用备份方案，不支持自动同步、历史回滚等功能。</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button 
                  onClick={() => backupToWebDAV()} 
                  variant="outline" 
                  className="mt-2"
                  disabled={connectionState === WebDAVConnectionState.checking}
                >
                  <Upload className={`mr-2 h-4 w-4 ${connectionState === WebDAVConnectionState.checking ? 'animate-spin' : ''}`} />
                  备份至WebDAV
                </Button>
                <Button 
                  onClick={() => syncFromWebDAV()} 
                  variant="outline" 
                  className="mt-2"
                  disabled={connectionState === WebDAVConnectionState.checking}
                >
                  <Download className={`mr-2 h-4 w-4 ${connectionState === WebDAVConnectionState.checking ? 'animate-spin' : ''}`} />
                  从WebDAV同步
                </Button>
              </CardContent>
            </Card>
          </div>
        </FormItem>
      </SettingRow>
      <SettingRow>
        <FormItem title="WebDAV 服务器地址" desc="输入WebDAV服务器的URL，例如：https://dav.example.com">
          <Input 
            value={url} 
            onChange={handleUrlChange} 
            placeholder="https://dav.example.com"
          />
        </FormItem>
      </SettingRow>

      <SettingRow>
        <FormItem title="用户名" desc="WebDAV服务器的用户名">
          <Input 
            value={username} 
            onChange={handleUsernameChange} 
            placeholder="用户名"
          />
        </FormItem>
      </SettingRow>

      <SettingRow>
        <FormItem title="密码" desc="WebDAV服务器的密码">
          <Input 
            value={password} 
            onChange={handlePasswordChange} 
            type="password" 
            placeholder="密码"
          />
        </FormItem>
      </SettingRow>

      <SettingRow>
        <FormItem title="备份路径" desc="WebDAV服务器上的备份路径，例如：/backup/notes">
          <Input 
            value={path} 
            onChange={handlePathChange} 
            placeholder="/backup/notes"
          />
        </FormItem>
      </SettingRow>
    </>
  );
}