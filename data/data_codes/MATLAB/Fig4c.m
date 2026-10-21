load('EXP4.mat')
graycolor = [0.2 0.2 0.2];
uniqsub = unique(data.subjects);
uniqcol = unique(data.colorDist);
uniqenc = unique(data.EncodingTime);
nEncode = length(uniqenc);
nColDis = length(uniqcol);
nsub    = length(uniqsub);
perf    = nan(nsub,nEncode,nColDis);
perf2   = nan(nsub,nEncode,nColDis);

for isub = 1:nsub
    for ien = 1:nEncode
        for ico = 1:nColDis

            idx = (data.subjects==uniqsub(isub)) & (data.EncodingTime==uniqenc(ien)) & (data.colorDist==uniqcol(ico));
            perf(isub,ien,ico)  = mean(data.flippedError(idx)>0);
            perf2(isub,ien,ico) = rad2deg(circ_std(deg2rad(data.flippedError(idx))));
        end
    end
end

mPerf = squeeze(mean(perf))-0.5;
sPerf = squeeze(std(perf)/sqrt(nsub));

figure();
for ien = 1:nEncode
    subplot(nEncode,1,ien);
    bar(1:nColDis,mPerf(ien,:),'FaceColor',graycolor,'FaceAlpha',0.5,'EdgeAlpha',0)
    hold on 
    errorbar(1:nColDis,mPerf(ien,:),sPerf(ien,:),sPerf(ien,:),'.','LineWidth',2,'Color',graycolor)
    plot([0,nColDis+1],[0,0],'Color',graycolor,'LineWidth',1.5);
    set(gca,'XTick',1:nColDis,'XTickLabel',uniqcol,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
    xlabel('color distance (deg)');
    ylabel('% repulsion bias');
    ylim([-0.15,0.15]);
    xlim([0,nColDis+1]);
    title(['Encoding Time of ' num2str(uniqenc(ien)*1000) ' ms']);
end
set(gcf,'OuterPosition',[0 0 400 1000])
    