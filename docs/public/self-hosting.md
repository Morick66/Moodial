# 自部署说明

自部署版本是项目的信任底座。

目标是让用户能把 Moodial 部署在自己的 NAS、VPS、云服务器或本地机器上。自部署实例也支持多用户账号，适合个人、家庭、朋友小圈子或小团队使用。

## 计划部署方式

```bash
cp .env.example .env
docker compose up -d
```

然后访问：

```text
http://localhost:3000
```

## 基础服务

默认 Docker Compose 包含：

- Web App；
- PostgreSQL；
- 本地数据目录。

## 初始化流程

1. 启动服务；
2. 创建管理员账号；
3. 配置是否开放注册；
4. 配置 AI 服务商和 API Key；
5. 邀请用户或自用；
6. 开始记录。

## 数据位置

自部署数据默认放在：

```text
./data
```

后续部署文档会补充备份、恢复、HTTPS、反向代理和 NAS 部署步骤。
