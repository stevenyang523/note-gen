import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormItem, SettingRow } from "../components/setting-base";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import useWebDAVStore, { WebDAVConnectionState } from "@/stores/webdav";

export default function WebdavSync() {
  const { 
    url, setUrl,
    username, setUsername,
    password, setPassword,
    path, setPath,
    connectionState, 
    testConnection,
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

      <SettingRow>
        <FormItem title="连接状态">
          <div className="flex items-center space-x-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>WebDAV 服务器连接</span>
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
                <CardDescription>WebDAV服务器连接状态，可用时才能进行同步操作</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => testConnection()} 
                  variant="outline" 
                  className="mt-2"
                  disabled={connectionState === WebDAVConnectionState.checking}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${connectionState === WebDAVConnectionState.checking ? 'animate-spin' : ''}`} />
                  刷新状态
                </Button>
              </CardContent>
            </Card>
          </div>
        </FormItem>
      </SettingRow>
    </>
  );
}