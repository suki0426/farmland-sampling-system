package com.jeeplus.teaching.integration.dto;

public class UdpStatusVO {

    private boolean running;
    private int port;
    private long receivedCount;
    private long acceptedCount;
    private long rejectedCount;

    public boolean isRunning() { return running; }
    public void setRunning(boolean running) { this.running = running; }
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    public long getReceivedCount() { return receivedCount; }
    public void setReceivedCount(long receivedCount) { this.receivedCount = receivedCount; }
    public long getAcceptedCount() { return acceptedCount; }
    public void setAcceptedCount(long acceptedCount) { this.acceptedCount = acceptedCount; }
    public long getRejectedCount() { return rejectedCount; }
    public void setRejectedCount(long rejectedCount) { this.rejectedCount = rejectedCount; }
}
