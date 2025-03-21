package ngx_stream_minecraft_forward_module.testing.spigot;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class HostnameInspect extends JavaPlugin implements Listener {

    private final Map<UUID, String> lastHit = new ConcurrentHashMap<>();

    @Override
    public void onEnable() {
        this.getServer().getPluginManager().registerEvents(this, this);
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onJoin(PlayerJoinEvent e) {
        final Player player = e.getPlayer();
        final String v = String.format("%s joined the game with hostname %s",
                player.getName(),
                lastHit.get(player.getUniqueId()));
        e.setJoinMessage(v);
        final BukkitTask taskSendMessage = Bukkit.getScheduler().runTaskTimerAsynchronously(this, () -> {
            player.sendMessage(v);
        }, 10L, 10L);
        final BukkitTask taskKick = Bukkit.getScheduler().runTaskLater(this, () -> {
            player.kickPlayer("");
        }, 20 * 29L);
        this.getServer().getPluginManager().registerEvents(new Listener() {
            @EventHandler(priority = EventPriority.MONITOR)
            public void onQuit(PlayerQuitEvent e) {
                Bukkit.getScheduler().cancelTask(taskSendMessage.getTaskId());
                Bukkit.getScheduler().cancelTask(taskKick.getTaskId());
                HandlerList.unregisterAll(this);
            }
        }, this);
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onLogin(PlayerLoginEvent e) {
        lastHit.put(e.getPlayer().getUniqueId(), e.getHostname());
    }
}
