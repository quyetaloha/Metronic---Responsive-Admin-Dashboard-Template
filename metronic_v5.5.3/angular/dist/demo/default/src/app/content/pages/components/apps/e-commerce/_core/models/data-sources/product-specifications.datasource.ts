import { from } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import * as _ from 'lodash';
import { ProductSpecificationsService } from '../../services/product-specifications.service';
import { QueryParamsModel } from '../query-models/query-params.model';
import { BaseDataSource } from './_base.datasource';
import { ListStateModel } from '../../utils/list-state.model';
import { environment } from '../../../../../../../../../environments/environment';

export class ProductSpecificationsDataSource extends BaseDataSource {
	constructor(private productSpecificationService: ProductSpecificationsService) {
		super();
	}

	loadSpecs(queryParams: QueryParamsModel, lastState: ListStateModel) {
		this.loadingSubject.next(true);
		this.productSpecificationService.findSpecs(queryParams, lastState)
			.pipe(
				catchError(() => from([])),
				finalize(() => this.loadingSubject.next(false))
			).subscribe(specs => {
				if (environment.isMockEnabled) {
					this.loadFakeSpecs(specs, queryParams, lastState);
				} else {
					this.loadRealSpecs(specs);
				}
			});
	}

	// Fake REST API (Mock)
	loadFakeSpecs(resultFromServer, queryParams: QueryParamsModel, lastState: ListStateModel) {
		// tslint:disable-next-line:prefer-const
		let filteredResult = [];
		if (lastState.deletedItems.length > 0) {
			resultFromServer.forEach(element => {
				const d_index = _.findIndex(lastState.deletedItems, function (o) { return o.id === element.id; });
				if (d_index === -1) {
					filteredResult.push(element);
				}
			});
		} else {
			filteredResult = resultFromServer;
		}

		// Update: Updated Items
		if (lastState.updatedItems.length > 0) {
			filteredResult.forEach(element => {
				const _rem = _.find(lastState.updatedItems, function (o) { return o.id === element.id; });
				if (_rem) {
					element._specificationName = _rem._specificationName;
					element.value = _rem.value;
					element.specId = _rem.specId;
				}
			});
		}

		// Add: New
		if (lastState.addedItems.length > 0) {
			lastState.addedItems.forEach(element => {
				filteredResult.push(element);
			});
		}

		const result = this.baseFilter(filteredResult, queryParams, []);
		this.entitySubject.next(result.items);
		this.paginatorTotalSubject.next(result.totalCount);
	}

	// Real REST API
	loadRealSpecs(resultFromServer) {
		this.entitySubject.next(resultFromServer);
		this.paginatorTotalSubject.next(resultFromServer.length);
	}
}
