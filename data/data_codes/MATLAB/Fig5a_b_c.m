load('EXP5.mat')
graycolor = [0.2 0.2 0.2];
uniqsub = unique(data.subjects);
uniqcon = unique(data.delays);
nsub    = length(uniqsub); 
ncond   = length(uniqcon);

%% Figure 5a

for icond = 1:ncond
    subplot(ncond,1,icond)
    histogram(data.flippedErrors(data.delays==uniqcon(icond)),200,'EdgeAlpha',0); hold on 
    plot([0,0],[0,180],'LineWidth',2,'LineStyle','-');
    plot([-45,-45],[0,180],'LineWidth',2,'LineStyle','--','Color',graycolor);
    ylim([0,180]);
    xlim([-180,180]);
    set(gca,'XTick',[-180 -90 0 90 180],'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
    title(['Delay Time of ' num2str(uniqcon(icond)) ' ms']);
end

%% Figure 5b 
perf  = nan(nsub,ncond);
perf2 = nan(nsub,ncond);
for isub = 1:nsub
    for icond = 1:ncond
        idx = (data.subjects==uniqsub(isub)) & (data.delays==uniqcon(icond));
        thiserr = data.flippedErrors(idx);
        thiserr = thiserr(~isnan(thiserr));
        perf(isub,icond)  = nanmean(thiserr>0)*100-50;
        perf2(isub,icond) = rad2deg(circ_std(deg2rad(thiserr)));
    end
end

mPerf = squeeze(mean(perf));
sPerf = squeeze(std(perf)/sqrt(nsub));

figure();
errorbar(uniqcon,mPerf,sPerf,sPerf,'LineWidth',2,'Color',graycolor);
hold on 
plot([uniqcon(1)-500,uniqcon(end)+500],[0,0],'LineWidth',2,'LineStyle','--','Color',graycolor);
ylim([-8,8]);
xlim([uniqcon(1)-500,uniqcon(end)+500]);
set(gca,'XTick',uniqcon,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
ylabel('% repulsion bias');    
xlabel('delay (ms)');
title('Figure5b');

%% Figure 5c

niti = 5000;
bootCorr = nan(niti,1);
for iti = 1:niti
    sampId = datasample(1:nsub,nsub);
    coef = polyfit(uniqcon.',mean(perf(sampId,:)),1);
    bootCorr(iti) = coef(1);
end
figure();
histogram(bootCorr,200,'EdgeAlpha',0);hold on 
plot([0,0],[0,100],'LineStyle',':','LineWidth',2)
xlabel('slope');
ylabel('counts');
set(gca,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
title('Figure 5c');
% In the paper, we used distributionPlot.m from https://www.mathworks.com/matlabcentral/fileexchange/23661-violin-plots-for-plotting-multiple-distributions-distributionplot-m
% distributionPlot(bootCorr)