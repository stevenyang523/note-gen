import { SidebarMenuButton } from "./ui/sidebar";
import { createSyncRepo, checkSyncRepoState, getUserInfo } from "@/lib/github";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import useSettingStore from "@/stores/setting";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CircleUserRound, LoaderPinwheel } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { UserInfo } from "@/lib/github.types";
import { Button } from "./ui/button";
import { RepoNames } from "@/lib/github.types";
import useSyncStore, { SyncStateEnum } from "@/stores/sync";

export default function AppStatus() {
  const t = useTranslations();
  const { accessToken, giteeAccessToken, primaryBackupMethod, setGithubUsername } = useSettingStore()
  const { 
    userInfo, 
    giteeUserInfo, 
    setUserInfo, 
    setGiteeUserInfo,
    setImageRepoState,
    setImageRepoInfo,
    syncRepoState,
    setSyncRepoState,
    setSyncRepoInfo,
    giteeSyncRepoState,
    setGiteeSyncRepoState,
    setGiteeSyncRepoInfo 
  } = useSyncStore()
  
  const [loading, setLoading] = useState(false)

  // 获取当前主要备份方式的用户信息
  async function handleGetUserInfo() {
    setLoading(true)
    try {
      if (primaryBackupMethod === 'github' && accessToken) {
        // 获取 GitHub 用户信息
        setImageRepoInfo(undefined)
        setSyncRepoInfo(undefined)
        setImageRepoState(SyncStateEnum.checking)
        setSyncRepoState(SyncStateEnum.checking)
        const res = await getUserInfo()
        if (res) {
          setUserInfo(res.data as UserInfo)
          setGithubUsername(res.data.login)
        }

        // 检查仓库状态 - GitHub
        await checkGithubRepos()
      } else if (primaryBackupMethod === 'gitee' && giteeAccessToken) {
        // 获取 Gitee 用户信息
        setGiteeSyncRepoInfo(undefined)
        setGiteeSyncRepoState(SyncStateEnum.checking)
        const res = await import('@/lib/gitee').then(module => module.getUserInfo())
        if (res) {
          setGiteeUserInfo(res)
        }

        // 检查仓库状态 - Gitee
        await checkGiteeRepos()
      } else {
        setUserInfo(undefined)
        setGiteeUserInfo(undefined)
      }
    } catch (err) {
      console.error('Failed to get user info:', err)
    } finally {
      setLoading(false)
    }
  }

  // 检查 GitHub 仓库状态
  async function checkGithubRepos() {
    try {
      // 检查图床仓库状态
      const imageRepo = await checkSyncRepoState(RepoNames.image)
      if (imageRepo) {
        setImageRepoInfo(imageRepo)
        setImageRepoState(SyncStateEnum.success)
      } else {
        setImageRepoState(SyncStateEnum.creating)
        const info = await createSyncRepo(RepoNames.image)
        if (info) {
          setImageRepoInfo(info)
          setImageRepoState(SyncStateEnum.success)
        } else {
          setImageRepoState(SyncStateEnum.fail)
        }
      }
      
      // 检查同步仓库状态
      const syncRepo = await checkSyncRepoState(RepoNames.sync)
      if (syncRepo) {
        setSyncRepoInfo(syncRepo)
        setSyncRepoState(SyncStateEnum.success)
      } else {
        setSyncRepoState(SyncStateEnum.creating)
        const info = await createSyncRepo(RepoNames.sync, true)
        if (info) {
          setSyncRepoInfo(info)
          setSyncRepoState(SyncStateEnum.success)
        } else {
          setSyncRepoState(SyncStateEnum.fail)
        }
      }
    } catch (err) {
      console.error('Failed to check GitHub repos:', err)
      setImageRepoState(SyncStateEnum.fail)
      setSyncRepoState(SyncStateEnum.fail)
    }
  }
  
  // 检查 Gitee 仓库状态
  async function checkGiteeRepos() {
    try {
      const { checkSyncRepoState, createSyncRepo } = await import('@/lib/gitee')
      
      // 检查同步仓库状态
      const syncRepo = await checkSyncRepoState(RepoNames.sync)
      if (syncRepo) {
        setGiteeSyncRepoInfo(syncRepo)
        setGiteeSyncRepoState(SyncStateEnum.success)
      } else {
        // 仓库不存在，尝试创建
        setGiteeSyncRepoState(SyncStateEnum.creating)
        const info = await createSyncRepo(RepoNames.sync, true) // 默认创建私有仓库
        if (info) {
          setGiteeSyncRepoInfo(info)
          setGiteeSyncRepoState(SyncStateEnum.success)
        } else {
          setGiteeSyncRepoState(SyncStateEnum.fail)
        }
      }
    } catch (err) {
      console.error('Failed to check Gitee repos:', err)
      setGiteeSyncRepoState(SyncStateEnum.fail)
    }
  }

  // 监听 token 变化，获取用户信息
  useEffect(() => {
    if (primaryBackupMethod === 'github' && accessToken) {
      handleGetUserInfo()
    } else if (primaryBackupMethod === 'gitee' && giteeAccessToken) {
      handleGetUserInfo()
    }
  }, [accessToken, giteeAccessToken, primaryBackupMethod])

  return (
    <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <div className="cursor-pointer">
              <Avatar className="h-8 w-8">
                {primaryBackupMethod === 'github' ? (
                  <>
                    <AvatarImage src={userInfo?.avatar_url} />
                    <AvatarFallback>{userInfo? userInfo.login.slice(0, 1): <CircleUserRound size={14}/>}</AvatarFallback>
                  </>
                ) : primaryBackupMethod === 'gitee' ? (
                  <>
                    <AvatarImage src={giteeUserInfo?.avatar_url} />
                    <AvatarFallback>{giteeUserInfo? giteeUserInfo.login.slice(0, 1): <CircleUserRound size={14}/>}</AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback><CircleUserRound size={14}/></AvatarFallback>
                )}
              </Avatar>
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-56 mr-12 mt-4">
            {/* GitHub 用户信息显示 */}
            {primaryBackupMethod === 'github' && userInfo ? (
              <div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userInfo.avatar_url} />
                    <AvatarFallback><CircleUserRound /></AvatarFallback>
                  </Avatar>
                  <div className="font-bold text-base">{userInfo.login}</div>
                </div>
                <div className="flex mt-4 justify-between items-center">
                  <div className="text-xs text-zinc-400">
                    Github {syncRepoState === SyncStateEnum.success ? <span className="text-green-500">●</span> : <span className="text-red-500">●</span>}
                  </div>
                </div>
                <div className="text-xs font-medium text-zinc-500 mt-2">{t('settings.sync.isPrimaryBackup', { type: 'Github' })}</div>
              </div>
            ) : primaryBackupMethod === 'gitee' && giteeUserInfo ? (
              <div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={giteeUserInfo.avatar_url} />
                    <AvatarFallback><CircleUserRound /></AvatarFallback>
                  </Avatar>
                  <div className="font-bold text-base">{giteeUserInfo.login}</div>
                </div>
                <div className="flex mt-4 justify-between items-center">
                  <div className="text-xs text-zinc-400">
                    Gitee {giteeSyncRepoState === SyncStateEnum.success ? <span className="text-green-500">●</span> : <span className="text-red-500">●</span>}
                  </div>
                </div>
                <div className="text-xs font-medium text-zinc-500 mt-2">{t('settings.sync.isPrimaryBackup', { type: 'Gitee' })}</div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <div>
                  <div className="text-center mb-4">
                    {primaryBackupMethod === 'github' && accessToken ? t('navigation.loading') : 
                    primaryBackupMethod === 'gitee' && giteeAccessToken ? t('navigation.loading') : 
                    t('navigation.login')}
                  </div>
                  <div className="flex justify-center">
                    {
                      loading ? <LoaderPinwheel size={32} className="animate-spin" /> : 
                      ((primaryBackupMethod === 'github' && !accessToken) || 
                      (primaryBackupMethod === 'gitee' && !giteeAccessToken)) && 
                      <Button className="w-full" onClick={handleGetUserInfo}>{t('navigation.login')}</Button>
                    }
                  </div>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </SidebarMenuButton>
  )
}