#!/bin/bash
# =============================================================
# 售后服务工单系统 - 服务监控守护脚本
# 部署位置: NAS /home/sun007002/workorder-monitor.sh
# 由 /etc/cron.d/workorder-monitor 每 2 分钟调用一次
#
# 功能:
#   1. 检查三个容器 (workorder-mysql/server/client) 是否运行，
#      未运行则自动拉起并记录最后 20 行日志便于排查
#   2. HTTP 健康检查: 前端 8087 / 后端 3100 /health
#   3. 全部日志写入 logs/workorder-monitor.log (自动轮转 >1MB)
# =============================================================

CONTAINERS="workorder-mysql workorder-server workorder-client"
LOG_DIR="/home/sun007002/logs"
LOG_FILE="$LOG_DIR/workorder-monitor.log"
MAX_LOG_SIZE=1048576  # 1MB

mkdir -p "$LOG_DIR"

# ---- 日志轮转 ----
if [ -f "$LOG_FILE" ] && [ "$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt "$MAX_LOG_SIZE" ]; then
    mv "$LOG_FILE" "$LOG_FILE.1"
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# ---- 1. 容器状态检查 + 自动拉起 ----
for c in $CONTAINERS; do
    STATE=$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)
    if [ "$STATE" != "true" ]; then
        log "WARN: 容器 $c 未运行 (state=${STATE:-notfound})，尝试启动..."
        docker start "$c" >> "$LOG_FILE" 2>&1
        sleep 3
        STATE=$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)
        if [ "$STATE" = "true" ]; then
            log "OK: 容器 $c 已恢复运行"
            log "--- $c 最后 20 行日志 (用于排查退出原因) ---"
            docker logs --tail 20 "$c" >> "$LOG_FILE" 2>&1
            log "--- 日志结束 ---"
        else
            log "ERROR: 容器 $c 启动失败！"
        fi
    fi
done

# ---- 2. HTTP 健康检查 (容器活着但服务无响应时告警) ----
check_http() {
    local name="$1" url="$2"
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null)
    if [ "$code" = "000" ]; then
        log "WARN: $name ($url) 无响应，尝试重启 workorder-server 容器"
        docker restart workorder-server >> "$LOG_FILE" 2>&1
    elif [ "$code" != "200" ]; then
        # 后端 /health 非预期状态码也记录（不重启，只告警）
        log "WARN: $name ($url) 状态码异常: $code"
    fi
}

# 后端 API 健康检查（返回 200 才算健康）
BACKEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:3100/health" 2>/dev/null)
if [ "$BACKEND_CODE" != "200" ]; then
    log "WARN: 后端 API /health 异常 (code=$BACKEND_CODE)，重启 workorder-server"
    docker restart workorder-server >> "$LOG_FILE" 2>&1
fi

# 前端页面检查
check_http "前端" "http://127.0.0.1:8087/"

# 静默成功：一切正常时不写日志，避免刷屏（只有异常和恢复才记录）
exit 0
