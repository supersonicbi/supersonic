package com.tencent.supersonic.headless.server.utils;

import com.tencent.supersonic.common.jsqlparser.SqlRemoveHelper;
import com.tencent.supersonic.common.jsqlparser.SqlReplaceHelper;
import com.tencent.supersonic.common.jsqlparser.SqlSelectFunctionHelper;
import com.tencent.supersonic.common.jsqlparser.SqlSelectHelper;
import com.tencent.supersonic.common.pojo.Aggregator;
import com.tencent.supersonic.common.pojo.Constants;
import com.tencent.supersonic.common.pojo.enums.AggOperatorEnum;
import com.tencent.supersonic.common.pojo.enums.EngineType;
import com.tencent.supersonic.common.pojo.enums.QueryType;
import com.tencent.supersonic.common.pojo.enums.TimeDimensionEnum;
import com.tencent.supersonic.headless.api.pojo.Measure;
import com.tencent.supersonic.headless.api.pojo.MetricTable;
import com.tencent.supersonic.headless.api.pojo.QueryParam;
import com.tencent.supersonic.headless.api.pojo.SchemaItem;
import com.tencent.supersonic.headless.api.pojo.enums.AggOption;
import com.tencent.supersonic.headless.api.pojo.enums.MetricType;
import com.tencent.supersonic.headless.api.pojo.request.QuerySqlReq;
import com.tencent.supersonic.headless.api.pojo.request.QueryStructReq;
import com.tencent.supersonic.headless.api.pojo.response.DatabaseResp;
import com.tencent.supersonic.headless.api.pojo.response.DimSchemaResp;
import com.tencent.supersonic.headless.api.pojo.response.MetricResp;
import com.tencent.supersonic.headless.api.pojo.response.MetricSchemaResp;
import com.tencent.supersonic.headless.api.pojo.response.ModelResp;
import com.tencent.supersonic.headless.api.pojo.response.SemanticSchemaResp;
import com.tencent.supersonic.headless.core.adaptor.db.DbAdaptor;
import com.tencent.supersonic.headless.core.adaptor.db.DbAdaptorFactory;
import com.tencent.supersonic.headless.core.pojo.DataSetQueryParam;
import com.tencent.supersonic.headless.core.pojo.QueryStatement;
import com.tencent.supersonic.headless.core.utils.SqlGenerateUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@Slf4j
public class QueryReqConverter {

    @Autowired
    private QueryStructUtils queryStructUtils;

    @Autowired
    private SqlGenerateUtils sqlGenerateUtils;

    public QueryStatement convert(QuerySqlReq querySQLReq, SemanticSchemaResp semanticSchemaResp)
            throws Exception {

        if (semanticSchemaResp == null) {
            return new QueryStatement();
        }
        // 1.convert name to bizName
        convertNameToBizName(querySQLReq, semanticSchemaResp);
        // 2.functionName corrector
        functionNameCorrector(querySQLReq, semanticSchemaResp);
        // 3.correct tableName
        correctTableName(querySQLReq);
        // 4.remove Underscores
        querySQLReq.setSql(SqlRemoveHelper.removeUnderscores(querySQLReq.getSql()));

        String tableName = SqlSelectHelper.getTableName(querySQLReq.getSql());
        if (StringUtils.isEmpty(tableName)) {
            return new QueryStatement();
        }
        // correct order item is same as agg alias
        String reqSql = querySQLReq.getSql();
        querySQLReq.setSql(SqlReplaceHelper.replaceAggAliasOrderItem(querySQLReq.getSql()));
        log.debug("replaceOrderAggSameAlias {} -> {}", reqSql, querySQLReq.getSql());
        // 5.build MetricTables
        List<String> allFields = SqlSelectHelper.getAllSelectFields(querySQLReq.getSql());
        List<MetricSchemaResp> metricSchemas = getMetrics(semanticSchemaResp, allFields);
        List<String> metrics =
                metricSchemas.stream().map(m -> m.getBizName()).collect(Collectors.toList());
        QueryStructReq queryStructReq = new QueryStructReq();
        MetricTable metricTable = new MetricTable();
        metricTable.setMetrics(metrics);

        Set<String> dimensions = getDimensions(semanticSchemaResp, allFields);

        metricTable.setDimensions(new ArrayList<>(dimensions));

        metricTable.setAlias(tableName.toLowerCase());
        // if metric empty , fill model default
        if (CollectionUtils.isEmpty(metricTable.getMetrics())) {
            metricTable.setMetrics(new ArrayList<>());
            metricTable.getMetrics().add(sqlGenerateUtils.generateInternalMetricName(
                    getDefaultModel(semanticSchemaResp, metricTable.getDimensions())));
        } else {
            queryStructReq.setAggregators(metricTable.getMetrics().stream()
                    .map(m -> new Aggregator(m, AggOperatorEnum.UNKNOWN))
                    .collect(Collectors.toList()));
        }
        AggOption aggOption = getAggOption(querySQLReq, metricSchemas);
        metricTable.setAggOption(aggOption);
        List<MetricTable> tables = new ArrayList<>();
        tables.add(metricTable);
        // 6.build ParseSqlReq
        DataSetQueryParam result = new DataSetQueryParam();
        BeanUtils.copyProperties(querySQLReq, result);

        result.setTables(tables);
        DatabaseResp database = semanticSchemaResp.getDatabaseResp();
        if (!sqlGenerateUtils.isSupportWith(EngineType.fromString(database.getType().toUpperCase()),
                database.getVersion())) {
            result.setSupportWith(false);
            result.setWithAlias(false);
        }
        // 7. do deriveMetric
        generateDerivedMetric(semanticSchemaResp, aggOption, result);
        // 8.physicalSql by ParseSqlReq

        queryStructReq.setDateInfo(queryStructUtils.getDateConfBySql(querySQLReq.getSql()));
        queryStructReq.setDataSetId(querySQLReq.getDataSetId());
        queryStructReq.setQueryType(getQueryType(aggOption));
        log.debug("QueryReqConverter queryStructReq[{}]", queryStructReq);
        QueryParam queryParam = new QueryParam();
        convert(queryStructReq, queryParam);
        QueryStatement queryStatement = new QueryStatement();
        queryStatement.setQueryParam(queryParam);
        queryStatement.setDataSetQueryParam(result);
        queryStatement.setIsS2SQL(true);
        queryStatement.setMinMaxTime(queryStructUtils.getBeginEndTime(queryStructReq));
        queryStatement.setDataSetId(querySQLReq.getDataSetId());
        queryStatement.setLimit(querySQLReq.getLimit());

        return queryStatement;
    }

    public void convert(QueryStructReq queryStructReq, QueryParam queryParam) {
        BeanUtils.copyProperties(queryStructReq, queryParam);
        queryParam.setOrders(queryStructReq.getOrders());
        queryParam.setMetrics(queryStructReq.getMetrics());
        queryParam.setGroups(queryStructReq.getGroups());
    }

    private AggOption getAggOption(QuerySqlReq databaseReq, List<MetricSchemaResp> metricSchemas) {
        String sql = databaseReq.getSql();
        if (!SqlSelectFunctionHelper.hasAggregateFunction(sql) && !SqlSelectHelper.hasGroupBy(sql)
                && !SqlSelectHelper.hasWith(sql) && !SqlSelectHelper.hasSubSelect(sql)) {
            log.debug("getAggOption simple sql set to DEFAULT");
            return AggOption.DEFAULT;
        }
        // if there is no group by in S2SQL,set MetricTable's aggOption to "NATIVE"
        // if there is count() in S2SQL,set MetricTable's aggOption to "NATIVE"
        if (!SqlSelectFunctionHelper.hasAggregateFunction(sql)
                || SqlSelectFunctionHelper.hasFunction(sql, "count")
                || SqlSelectFunctionHelper.hasFunction(sql, "count_distinct")) {
            return AggOption.OUTER;
        }
        if (databaseReq.isInnerLayerNative()) {
            return AggOption.NATIVE;
        }
        if (SqlSelectHelper.hasSubSelect(sql) || SqlSelectHelper.hasWith(sql)
                || SqlSelectHelper.hasGroupBy(sql)) {
            return AggOption.OUTER;
        }
        long defaultAggNullCnt = metricSchemas.stream().filter(
                m -> Objects.isNull(m.getDefaultAgg()) || StringUtils.isBlank(m.getDefaultAgg()))
                .count();
        if (defaultAggNullCnt > 0) {
            log.debug("getAggOption find null defaultAgg metric set to NATIVE");
            return AggOption.OUTER;
        }
        return AggOption.DEFAULT;
    }

    private void convertNameToBizName(QuerySqlReq querySqlReq,
            SemanticSchemaResp semanticSchemaResp) {
        Map<String, String> fieldNameToBizNameMap = getFieldNameToBizNameMap(semanticSchemaResp);
        String sql = querySqlReq.getSql();
        log.debug("dataSetId:{},convert name to bizName before:{}", querySqlReq.getDataSetId(),
                sql);
        sql = SqlReplaceHelper.replaceSqlByPositions(sql);
        log.debug("replaceSqlByPositions:{}", sql);
        String replaceFields = SqlReplaceHelper.replaceFields(sql, fieldNameToBizNameMap, true);
        log.debug("dataSetId:{},convert name to bizName after:{}", querySqlReq.getDataSetId(),
                replaceFields);
        querySqlReq.setSql(replaceFields);
    }

    private Set<String> getDimensions(SemanticSchemaResp semanticSchemaResp,
            List<String> allFields) {
        Map<String, String> dimensionLowerToNameMap = semanticSchemaResp.getDimensions().stream()
                .collect(Collectors.toMap(entry -> entry.getBizName().toLowerCase(),
                        SchemaItem::getBizName, (k1, k2) -> k1));
        Map<String, String> internalLowerToNameMap = QueryStructUtils.internalCols.stream()
                .collect(Collectors.toMap(String::toLowerCase, a -> a));
        dimensionLowerToNameMap.putAll(internalLowerToNameMap);
        return allFields.stream()
                .filter(entry -> dimensionLowerToNameMap.containsKey(entry.toLowerCase()))
                .map(entry -> dimensionLowerToNameMap.get(entry.toLowerCase()))
                .collect(Collectors.toSet());
    }

    private List<MetricSchemaResp> getMetrics(SemanticSchemaResp semanticSchemaResp,
            List<String> allFields) {
        Map<String, MetricSchemaResp> metricLowerToNameMap =
                semanticSchemaResp.getMetrics().stream().collect(Collectors
                        .toMap(entry -> entry.getBizName().toLowerCase(), entry -> entry));
        return allFields.stream()
                .filter(entry -> metricLowerToNameMap.containsKey(entry.toLowerCase()))
                .map(entry -> metricLowerToNameMap.get(entry.toLowerCase()))
                .collect(Collectors.toList());
    }

    private void functionNameCorrector(QuerySqlReq databaseReq,
            SemanticSchemaResp semanticSchemaResp) {
        DatabaseResp database = semanticSchemaResp.getDatabaseResp();
        if (Objects.isNull(database) || Objects.isNull(database.getType())) {
            return;
        }
        String type = database.getType();
        DbAdaptor engineAdaptor = DbAdaptorFactory.getEngineAdaptor(type.toLowerCase());
        if (Objects.nonNull(engineAdaptor)) {
            String functionNameCorrector =
                    engineAdaptor.functionNameCorrector(databaseReq.getSql());
            databaseReq.setSql(functionNameCorrector);
        }
    }

    protected Map<String, String> getFieldNameToBizNameMap(SemanticSchemaResp semanticSchemaResp) {
        // support fieldName and field alias to bizName
        Map<String, String> dimensionResults = semanticSchemaResp.getDimensions().stream().flatMap(
                entry -> getPairStream(entry.getAlias(), entry.getName(), entry.getBizName()))
                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight, (k1, k2) -> k1));

        Map<String, String> metricResults = semanticSchemaResp.getMetrics().stream().flatMap(
                entry -> getPairStream(entry.getAlias(), entry.getName(), entry.getBizName()))
                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight, (k1, k2) -> k1));

        dimensionResults.putAll(TimeDimensionEnum.getChNameToNameMap());
        dimensionResults.putAll(TimeDimensionEnum.getNameToNameMap());
        dimensionResults.putAll(metricResults);
        return dimensionResults;
    }

    private Stream<Pair<String, String>> getPairStream(String aliasStr, String name,
            String bizName) {
        Set<Pair<String, String>> elements = new HashSet<>();
        elements.add(Pair.of(name, bizName));
        if (StringUtils.isNotBlank(aliasStr)) {
            List<String> aliasList = SchemaItem.getAliasList(aliasStr);
            for (String alias : aliasList) {
                elements.add(Pair.of(alias, bizName));
            }
        }
        return elements.stream();
    }

    public void correctTableName(QuerySqlReq querySqlReq) {
        String sql = querySqlReq.getSql();
        sql = SqlReplaceHelper.replaceTable(sql,
                Constants.TABLE_PREFIX + querySqlReq.getDataSetId());
        log.debug("correctTableName after:{}", sql);
        querySqlReq.setSql(sql);
    }

    private QueryType getQueryType(AggOption aggOption) {
        boolean isAgg = AggOption.isAgg(aggOption);
        QueryType queryType = QueryType.DETAIL;
        if (isAgg) {
            queryType = QueryType.AGGREGATE;
        }
        return queryType;
    }

    private void generateDerivedMetric(SemanticSchemaResp semanticSchemaResp, AggOption aggOption,
            DataSetQueryParam viewQueryParam) {
        String sql = viewQueryParam.getSql();
        for (MetricTable metricTable : viewQueryParam.getTables()) {
            Set<String> measures = new HashSet<>();
            Map<String, String> replaces = generateDerivedMetric(semanticSchemaResp, aggOption,
                    metricTable.getMetrics(), metricTable.getDimensions(), measures);

            if (!CollectionUtils.isEmpty(replaces)) {
                // metricTable sql use measures replace metric
                sql = SqlReplaceHelper.replaceSqlByExpression(sql, replaces);
                metricTable.setAggOption(AggOption.NATIVE);
                // metricTable use measures replace metric
                if (!CollectionUtils.isEmpty(measures)) {
                    metricTable.setMetrics(new ArrayList<>(measures));
                } else {
                    // empty measure , fill default
                    metricTable.setMetrics(new ArrayList<>());
                    metricTable.getMetrics().add(sqlGenerateUtils.generateInternalMetricName(
                            getDefaultModel(semanticSchemaResp, metricTable.getDimensions())));
                }
            }
        }
        viewQueryParam.setSql(sql);
    }

    private Map<String, String> generateDerivedMetric(SemanticSchemaResp semanticSchemaResp,
            AggOption aggOption, List<String> metrics, List<String> dimensions,
            Set<String> measures) {
        Map<String, String> result = new HashMap<>();
        List<MetricSchemaResp> metricResps = semanticSchemaResp.getMetrics();
        List<DimSchemaResp> dimensionResps = semanticSchemaResp.getDimensions();

        // Check if any metric is derived
        boolean hasDerivedMetrics =
                metricResps.stream().anyMatch(m -> metrics.contains(m.getBizName()) && MetricType
                        .isDerived(m.getMetricDefineType(), m.getMetricDefineByMeasureParams()));
        if (!hasDerivedMetrics) {
            return result;
        }

        log.debug("begin to generateDerivedMetric {} [{}]", aggOption, metrics);

        Set<String> allFields = new HashSet<>();
        Map<String, Measure> allMeasures = new HashMap<>();
        semanticSchemaResp.getModelResps().forEach(modelResp -> {
            allFields.addAll(modelResp.getFieldList());
            if (modelResp.getModelDetail().getMeasures() != null) {
                modelResp.getModelDetail().getMeasures()
                        .forEach(measure -> allMeasures.put(measure.getBizName(), measure));
            }
        });

        Set<String> derivedDimensions = new HashSet<>();
        Set<String> derivedMetrics = new HashSet<>();
        Map<String, String> visitedMetrics = new HashMap<>();

        for (MetricResp metricResp : metricResps) {
            if (metrics.contains(metricResp.getBizName())) {
                boolean isDerived = MetricType.isDerived(metricResp.getMetricDefineType(),
                        metricResp.getMetricDefineByMeasureParams());
                if (isDerived) {
                    String expr = sqlGenerateUtils.generateDerivedMetric(metricResps, allFields,
                            allMeasures, dimensionResps, sqlGenerateUtils.getExpr(metricResp),
                            metricResp.getMetricDefineType(), aggOption, visitedMetrics,
                            derivedMetrics, derivedDimensions);
                    result.put(metricResp.getBizName(), expr);
                    log.debug("derived metric {}->{}", metricResp.getBizName(), expr);
                } else {
                    measures.add(metricResp.getBizName());
                }
            }
        }

        measures.addAll(derivedMetrics);
        derivedDimensions.stream().filter(dimension -> !dimensions.contains(dimension))
                .forEach(dimensions::add);

        return result;
    }

    private String getDefaultModel(SemanticSchemaResp semanticSchemaResp, List<String> dimensions) {
        if (!CollectionUtils.isEmpty(dimensions)) {
            Map<String, Long> modelMatchCnt = new HashMap<>();
            for (ModelResp modelResp : semanticSchemaResp.getModelResps()) {
                modelMatchCnt.put(modelResp.getBizName(), modelResp.getModelDetail().getDimensions()
                        .stream().filter(d -> dimensions.contains(d.getBizName())).count());
            }
            return modelMatchCnt.entrySet().stream()
                    .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                    .map(m -> m.getKey()).findFirst().orElse("");
        }
        return semanticSchemaResp.getModelResps().get(0).getBizName();
    }
}
