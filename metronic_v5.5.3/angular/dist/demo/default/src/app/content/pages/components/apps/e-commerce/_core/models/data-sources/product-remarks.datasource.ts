import { from } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import * as _ from 'lodash';
import { ProductRemarksService } from '../../services/product-remarks.service';
import { QueryParamsModel } from '../query-models/query-params.model';
import { BaseDataSource } from './_base.datasource';
import { ListStateModel } from '../../utils/list-state.model';
import { environment } from '../../../../../../../../../environments/environment';
export class ProductRemarksDataSource extends BaseDataSource {
	constructor(private productRemarksService: ProductRemarksService) {
		super();
	}

	loadRemarks(queryParams: QueryParamsModel, lastState: ListStateModel) {
		this.loadingSubject.next(true);

		this.productRemarksService.findRemarks(queryParams, lastState)
			.pipe(
				catchError(() => from([])),
				finalize(() => this.loadingSubject.next(false))
			).subscribe(remarks => {

				if (environment.isMockEnabled) {
					this.loadFakeRemarks(remarks, queryParams, lastState);
				} else {
					this.loadRealRemarks(remarks);
				}

			});
	}

	// Fake REST API (Mock)
	loadFakeRemarks(resultFromServer, queryParams: QueryParamsModel, lastState: ListStateModel) {
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
					element.text = _rem.text;
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
	loadRealRemarks(resultFromServer) {
		this.entitySubject.next(resultFromServer);
		this.paginatorTotalSubject.next(resultFromServer.length);
	}
}
